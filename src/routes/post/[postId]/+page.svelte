<script>
  import './postView.css';
  import { page } from "$app/stores";
  import { authStore } from "../../../store/auth.js"; // Double-check this path!
  import { db, getUserProfile } from "$lib/firebase"; 
  import { 
    doc, getDoc, updateDoc, arrayUnion, arrayRemove, 
    collection, getDocs, addDoc, query, orderBy, serverTimestamp, increment 
  } from "firebase/firestore";
  
  // ADDED: We must import the PostCard component so we can use it in the HTML!
  import PostCard from "$lib/postCard/postCard.svelte";

  let postId = $derived($page.params.postId); 

  /** @type {any} */
  let currentPost = $state(null);
  
  /** @type {any[]} */
  let comments = $state([]);
  let newCommentText = $state("");
  let isSubmitting = $state(false);
  
  /** @type {any} */
  let replyingTo = $state(null); 
  
  let isLoading = $state(true);
  let postNotFound = $state(false);
  let errorMessage = $state("");

  $effect(() => {
    if (!postId) return;

    async function loadPostAndComments() {
      isLoading = true;
      errorMessage = "";
      postNotFound = false;

      try {
        const postRef = doc(db, "posts", /** @type {string} */ (postId));
        const docSnap = await getDoc(postRef);

        if (docSnap.exists()) {
          currentPost = { id: docSnap.id, ...docSnap.data() };
          if (!currentPost.likes) currentPost.likes = [];
          if (!currentPost.commentCount) currentPost.commentCount = 0;
          
          const commentsRef = collection(db, "posts", /** @type {string} */ (postId), "comments");
          const q = query(commentsRef, orderBy("createdAt", "asc"));
          const commentsSnap = await getDocs(q);
          
          comments = commentsSnap.docs.map(doc => ({ 
            id: doc.id, 
            likes: [], 
            ...doc.data() 
          }));

        } else {
          postNotFound = true;
        }
      } catch (error) {
        console.error("Firebase Read Error:", error);
        errorMessage = "Failed to load the post. Check your connection or security rules.";
      } finally {
        isLoading = false;
      }
    }

    loadPostAndComments();
  });

  // NOTE: The main toggleLike() function was removed here because your new 
  // <PostCard /> component handles it internally now!

  /** @param {any} comment */
  async function toggleCommentLike(comment) {
    const uid = $authStore?.user?.uid;
    if (!uid) return alert("You must be logged in to like a comment!");

    const hasLiked = comment.likes?.includes(uid);
    const commentRef = doc(db, "posts", /** @type {string} */ (postId), "comments", comment.id);

    if (hasLiked) {
      comment.likes = comment.likes.filter(/** @param {string} id */ (id) => id !== uid);
    } else {
      comment.likes = [...(comment.likes || []), uid];
    }

    try {
      if (hasLiked) await updateDoc(commentRef, { likes: arrayRemove(uid) });
      else await updateDoc(commentRef, { likes: arrayUnion(uid) });
    } catch (error) {
      console.error("Error toggling comment like:", error);
      if (hasLiked) comment.likes = [...(comment.likes || []), uid];
      else comment.likes = comment.likes.filter(/** @param {string} id */ (id) => id !== uid);
    }
  }

  async function submitComment() {
    const uid = $authStore?.user?.uid;
    const displayName = $authStore?.user?.displayName || "Anonymous User";
    
    if (!uid) return alert("You must be logged in to comment!");
    if (!newCommentText.trim()) return;

    isSubmitting = true;
    const textToPost = newCommentText;
    
    const parentId = replyingTo ? (replyingTo.parentId || replyingTo.id) : null;
    
    newCommentText = ""; 
    const cachedReplyState = replyingTo;
    replyingTo = null; 

    let isOrgAdmin = false;
    try {
      const userProfile = await getUserProfile(/** @type {string} */ (uid));
      if (userProfile && userProfile.managedOrgIDs?.includes(currentPost.orgId)) {
        isOrgAdmin = true;
      }
    } catch (err) {
      console.error("Failed to verify admin status:", err);
    }

    const temporaryComment = {
      id: "temp-" + Date.now(),
      authorName: displayName,
      text: textToPost,
      isOrgAdmin: isOrgAdmin,
      likes: [],
      parentId: parentId 
    };
    
    comments = [...comments, temporaryComment];
    currentPost.commentCount += 1;

    try {
      const postRef = doc(db, "posts", /** @type {string} */ (postId));
      const commentsRef = collection(db, "posts", /** @type {string} */ (postId), "comments"); 

      const docRef = await addDoc(commentsRef, {
        text: textToPost,
        authorId: uid,
        authorName: displayName,
        createdAt: serverTimestamp(),
        isOrgAdmin: isOrgAdmin,
        likes: [],
        parentId: parentId 
      });

      comments = comments.map(c => 
        c.id === temporaryComment.id ? { ...c, id: docRef.id } : c
      );
      await updateDoc(postRef, { commentCount: increment(1) });

    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to post comment. Check your connection.");
      comments = comments.filter(c => c.id !== temporaryComment.id);
      currentPost.commentCount -= 1;
      newCommentText = textToPost; 
      replyingTo = cachedReplyState; 
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="wholePage">
  <div class="nav"></div>
  <main class="post-container">
    {#if isLoading}
      <div class="status-box">Loading post data...</div>
    {:else if errorMessage}
      <div class="status-box error">{errorMessage}</div>
    {:else if postNotFound}
      <div class="status-box error">Error 404: Post not found! The ID '{postId}' does not exist.</div>
    {:else if currentPost}
      
      <PostCard post={currentPost} />

      <section class="comments-section">
        <h3>Discussion</h3>

        <div class="comments-list">
          {#each comments.filter(c => !c.parentId) as comment (comment.id)}
            <div class="comment-bubble" class:admin-bubble={comment.isOrgAdmin}>
              <strong>
                {comment.authorName}
                {#if comment.isOrgAdmin}
                  <span class="admin-badge">Organization Officer</span>
                {/if}
              </strong>
              <p>{comment.text}</p>
              
              <div class="comment-actions">
                <button class="comment-action-btn" onclick={() => toggleCommentLike(comment)}>
                  {comment.likes?.includes($authStore?.user?.uid) ? "❤️" : "🤍"} {comment.likes?.length || 0}
                </button>
                <button class="comment-action-btn" onclick={() => {
                  replyingTo = comment;
                  newCommentText = `@${comment.authorName} `;
                }}>Reply</button>
              </div>
            </div>

            {#each comments.filter(r => r.parentId === comment.id) as reply (reply.id)}
              <div class="comment-bubble reply-bubble" class:admin-bubble={reply.isOrgAdmin}>
                <strong>
                  {reply.authorName}
                  {#if reply.isOrgAdmin}
                    <span class="admin-badge">Organization Officer</span>
                  {/if}
                </strong>
                <p>{reply.text}</p>
                
                <div class="comment-actions">
                  <button class="comment-action-btn" onclick={() => toggleCommentLike(reply)}>
                    {reply.likes?.includes($authStore?.user?.uid) ? "❤️" : "🤍"} {reply.likes?.length || 0}
                  </button>
                  
                  <button class="comment-action-btn" onclick={() => {
                    replyingTo = reply;
                    newCommentText = `@${reply.authorName} `;
                  }}>Reply</button>
                </div>
              </div>
            {/each}

          {:else}
            <p class="no-comments">Be the first to comment!</p>
          {/each}
        </div>

        {#if replyingTo}
          <div class="replying-indicator">
            <span>Replying to <strong>{replyingTo.authorName}</strong></span>
            <button class="cancel-reply-btn" onclick={() => replyingTo = null}>×</button>
          </div>
        {/if}

        <div class="comment-input-area">
          <textarea 
            bind:value={newCommentText} 
            placeholder={replyingTo ? `Write a reply...` : `Add a comment...`}
            disabled={isSubmitting}
          ></textarea>
          <button 
            class="submit-comment-btn" 
            onclick={submitComment} 
            disabled={isSubmitting || !newCommentText.trim()}
          >
            {isSubmitting ? "..." : (replyingTo ? "Reply" : "Post")}
          </button>
        </div>
      </section>
      
    {/if}
  </main>
</div>