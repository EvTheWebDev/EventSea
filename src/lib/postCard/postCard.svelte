<script>
import './postCard.css';
  import { authStore } from "../../store/auth.js"; 
  import { db } from "$lib/firebase"; 
  import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";

  /** @type {{ post: any, userProfile?: any }} */
  let { post, userProfile = null } = $props();

  let isDeleted = $state(false);
  
  // NEW: State to track if the three-dot menu is open
  let isMenuOpen = $state(false);

  let isAdmin = $derived(
    userProfile?.managedOrgIDs?.includes(post.orgId) || false
  );

  async function toggleLike(/** @type {Event} */ e) {
    e.preventDefault(); 
    e.stopPropagation();

    const uid = $authStore?.user?.uid;
    if (!uid) return alert("You must be logged in to like a post!");
    if (!post) return;

    const hasLiked = post.likes?.includes(uid);
    const postRef = doc(db, "posts", post.id);

    if (hasLiked) {
      post.likes = post.likes.filter(/** @param {string} id */ (id) => id !== uid);
    } else {
      post.likes = [...(post.likes || []), uid];
    }

    try {
      if (hasLiked) await updateDoc(postRef, { likes: arrayRemove(uid) });
      else await updateDoc(postRef, { likes: arrayUnion(uid) });
    } catch (error) {
      console.error("Error toggling like:", error);
      if (hasLiked) post.likes = [...(post.likes || []), uid];
      else post.likes = post.likes.filter(/** @param {string} id */ (id) => id !== uid);
    }
  }

  // NEW: Toggle the menu
  function toggleMenu(/** @type {Event} */ e) {
    e.preventDefault();
    e.stopPropagation();
    isMenuOpen = !isMenuOpen;
  }

  // NEW: Placeholder for your edit functionality
  function handleEdit(/** @type {Event} */ e) {
    e.preventDefault();
    e.stopPropagation();
    isMenuOpen = false; // Close menu
    alert("Edit mode coming soon! (You can swap this to open an inline editor or redirect to an edit page.)");
  }

  async function handleDelete(/** @type {Event} */ e) {
    e.preventDefault();
    e.stopPropagation();
    isMenuOpen = false; // Close menu

    const confirmed = confirm("Are you sure you want to delete this announcement? This cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "posts", post.id));
      isDeleted = true;
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Do you have the correct permissions?");
    }
  }
</script>

{#if !isDeleted}
  <a href={`/post/${post.id}`} class="post-card-link">
    <article class="post-card">
      <div class="post-header">
        <div class="title-group">
          <h2>{post.title}</h2>
          <span class="org-badge">{post.orgName}</span>
        </div>
        
        {#if isAdmin}
          <div class="menu-container">
            <button class="options-btn" onclick={toggleMenu} title="Post Options">⋮</button>
            
            {#if isMenuOpen}
              <div class="dropdown-menu">
                <button class="dropdown-item" onclick={handleEdit}>
                  ✏️ Edit
                </button>
                <button class="dropdown-item delete-item" onclick={handleDelete}>
                  🗑️ Delete
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      {#if post.imageUrl && post.imageUrl !== "/placeholder.jpg"}
        <img src={post.imageUrl} alt="Post visual" class="post-image" />
      {/if}
      
      <p class="post-description">{post.description}</p>

      <div class="engagement-bar">
        <button class="like-btn" onclick={toggleLike}>
          {#if post.likes?.includes($authStore?.user?.uid)}
            ❤️ Liked ({post.likes?.length || 0})
          {:else}
            🤍 Like ({post.likes?.length || 0})
          {/if}
        </button>
        <span class="comment-count">
          💬 {post.commentCount || 0} Comments
        </span>
      </div>
    </article>
  </a>
{/if}