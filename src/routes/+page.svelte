<script>
  import "./home.css";
  import "../global.css";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  
  import { Event, Org } from "$lib"; 
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import PostCard from "$lib/postCard/postCard.svelte"; 
  
  import { authStore } from "../store/auth.js"; 
  import { db, fetchEvents, fetchOrgs, getUserProfile } from "$lib/firebase";
  import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

  // 1. STATE VARIABLES (Typed with JSDoc instead of TS Interfaces)
  /** @type {any[]} */
  let trendingEvents = [];
  let loading = true;
  
  /** @type {any[]} */
  let featuredOrgs = [];
  let loadingOrgs = true;

  /** @type {any[]} */
  let globalPosts = [];
  /** @type {any[]} */
  let sortedPosts = [];
  let loadingPosts = true;
  
  /** @type {any} */
  let userProfile = null;

  onMount(async () => {
    // FETCH EVENTS
    try {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, orderBy("createdAt", "desc"), limit(3));
      const snapshot = await getDocs(q);
      trendingEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      loading = false;
    }

    // FETCH ORGS
    try {
      featuredOrgs = await fetchOrgs({ mode: 'featured', limitCount: 4 });
    } catch (err) {
      console.error("Error loading orgs:", err);
    } finally {
      loadingOrgs = false;
    }

    // FETCH POSTS 
    try {
      const postsRef = collection(db, "posts");
      const postQ = query(postsRef, orderBy("createdAt", "desc"), limit(6));
      const postSnap = await getDocs(postQ);
      globalPosts = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      loadingPosts = false;
    }
  });

  // 2. REACTIVE SORTER
  $: {
    const uid = $authStore?.user?.uid;
    if (uid && !userProfile) {
      // Use the JSDoc string cast to satisfy the Firebase overload rule
      getUserProfile(/** @type {string} */ (uid)).then(profile => { 
        userProfile = profile; 
      });
    }

    if (userProfile && userProfile.followedOrgs) {
      sortedPosts = [...globalPosts].sort((a, b) => {
        // Safe-check the arrays before using .includes()
        const aFollowed = userProfile?.followedOrgs?.includes(a.orgId) ? 1 : 0;
        const bFollowed = userProfile?.followedOrgs?.includes(b.orgId) ? 1 : 0;
        return bFollowed - aFollowed; 
      });
    } else {
      sortedPosts = globalPosts; 
    }
  }
</script>

<main>
  <div class="homeHero">
    <div class="homeText">
      <h2>Discover. Explore.</h2>
      <h1>Set Sail.</h1>
      <p>An event hub for students, by students.</p>
      <input
        type="search"
        name="search"
        id="search"
        placeholder="Find your next adventure..."
      />
    </div>
  </div>

  <div class="trendingEvents">
    <h2 class="heading">Trending Events</h2>
    <div class="trendingEventCards">
      {#if loading}
        <p>Loading events...</p>
      {:else if trendingEvents.length > 0}
        {#each trendingEvents as event}
          <EventCard {event} />
        {/each}
      {:else}
        <p>No upcoming events found.</p>
      {/if}
    </div>
    <div class="more"><a id="more" href="/events">More Events</a></div>
  </div>

  <div class="trendingPosts">
    <h2 class="heading">Latest Announcements</h2>
    <div class="postCards">
      {#if loadingPosts}
        <p>Loading posts...</p>
      {:else if sortedPosts.length > 0}
        {#each sortedPosts as post}
          <PostCard {post} />
        {/each}
      {:else}
        <p>No announcements found.</p>
      {/if}
    </div>
    <div class="more"><a id="more" href="/postFeed">View Full Feed</a></div>
  </div>

  <div class="category">
    <h2 class="heading">Browse by Category</h2>
    <div class="categories">
      <a href="/category" class="categoryCard">
        <Icon icon="solar:square-academic-cap-bold" width="45" height="45" style="color: #1b065e" />
        <h3>Academic</h3>
        <span><Icon icon="mdi:event-outline" class="margin" width="18" height="18" />18 events</span>
      </a>
      <a href="/events?category=careers" class="categoryCard">
        <Icon icon="tabler:briefcase" width="45" height="45" style="color: #1b065e" />
        <h3>Careers</h3>
        <span><Icon icon="mdi:event-outline" class="margin" width="18" height="18" />18 events</span>
      </a>
      <a href="/events?category=workshops" class="categoryCard">
        <Icon icon="grommet-icons:workshop" width="45" height="45" style="color: #1b065e" />
        <h3>Workshops</h3>
        <span><Icon icon="mdi:event-outline" class="margin" width="18" height="18" />18 events</span>
      </a>
      <a href="/events?category=fun" class="categoryCard">
        <Icon icon="lucide:party-popper" width="45" height="45" style="color: #1b065e" />
        <h3>Fun</h3>
        <span><Icon icon="mdi:event-outline" class="margin" width="18" height="18" />18 events</span>
      </a>
      <a href="/events?category=worship" class="categoryCard">
        <Icon icon="fa7-solid:pray" width="45" height="45" style="color: #1b065e" />
        <h3>Worship</h3>
        <span><Icon icon="mdi:event-outline" class="margin" width="18" height="18" />18 events</span>
      </a>
    </div>
  </div>

  <div class="organizations">
    <h2 class="heading">Featured Organizations</h2>
    
    <div class="orgCards">
      {#if loadingOrgs}
        <p>Loading organizations...</p>
      {:else if featuredOrgs.length > 0}
        {#each featuredOrgs as org (org.id)}
          <Org {org} />
        {/each}
      {:else}
        <p>No organizations found.</p>
      {/if}
    </div>

    <div class="more">
      <a id="more" href="/organizations">More Organizations</a>
    </div>
  </div>
</main>