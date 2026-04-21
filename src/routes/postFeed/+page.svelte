<script>
  import './postFeed.css';
    import '../../global.css';
  import PostCard from "$lib/postCard/postCard.svelte";
  import { authStore } from "../../store/auth.js"; // Adjust path to your auth store
  import { db, getUserProfile } from "$lib/firebase";
  import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

  // 1. STATE VARIABLES
  /** @type {any[]} */
  let allPosts = $state([]);
  let isLoading = $state(true);
  
  // Controls whether we show "latest" or "following"
  let currentFilter = $state('latest'); 
  
  /** @type {any} */
  let userProfile = $state(null);

  // 2. FETCH DATA ON MOUNT
  $effect(() => {
    async function loadFeed() {
      isLoading = true;
      
      // Fetch the top 50 newest posts globally
      try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"), limit(50));
        const snapshot = await getDocs(q);
        
        allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.error("Error loading feed:", err);
      }

      // If a user is logged in, grab their profile so we know who they follow
      const uid = $authStore?.user?.uid;
      if (uid) {
        try {
          userProfile = await getUserProfile(/** @type {string} */ (uid));
        } catch (err) {
          console.error("Error loading profile:", err);
        }
      }
      
      isLoading = false;
    }

    loadFeed();
  });

  // 3. REACTIVE FILTERING
  // This automatically recalculates the list whenever 'allPosts', 'currentFilter', or 'userProfile' changes!
  let displayedPosts = $derived(
    currentFilter === 'following' && userProfile?.followedOrgs
      ? allPosts.filter(post => userProfile.followedOrgs.includes(post.orgId))
      : allPosts
  );
</script>

<div class="wholePage">
    <div class="nav"></div>
    <main class="feed-container">
  <div class="feed-header">
    <h1>Your Feed</h1>
    
    <div class="feed-filters">
      <button 
        class="filter-btn {currentFilter === 'latest' ? 'active' : ''}"
        onclick={() => currentFilter = 'latest'}
      >
        Latest
      </button>
      <button 
        class="filter-btn {currentFilter === 'following' ? 'active' : ''}"
        onclick={() => {
          if (!$authStore?.user) {
            alert("You must be logged in to filter by followed organizations!");
            return;
          }
          currentFilter = 'following';
        }}
      >
        Following
      </button>
    </div>
  </div>

  <div class="feed-list">
    {#if isLoading}
      <div class="status-box">Loading the latest updates...</div>
    {:else if displayedPosts.length > 0}
      
      {#each displayedPosts as post (post.id)}
        <PostCard {post} />
      {/each}

    {:else}
      {#if currentFilter === 'following'}
        <div class="empty-state">
          <h3>No posts found!</h3>
          <p>The organizations you follow haven't posted anything recently, or you aren't following anyone yet.</p>
        </div>
      {:else}
        <div class="empty-state">
          <h3>It's quiet in here.</h3>
          <p>No announcements have been posted yet. Check back later!</p>
        </div>
      {/if}
    {/if}
  </div>
</main>
</div>
