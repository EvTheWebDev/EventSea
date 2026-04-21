<script>
  import "./home.css";
  import "../global.css";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import { db, fetchEvents, fetchOrgs } from "$lib/firebase";
  import { findBestSearchMatch } from "$lib/search";
  import SearchNotFoundModal from "$lib/searchNotFoundModal.svelte";
  import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
  } from "firebase/firestore";

  /** @type {Array<Record<string, any>>} */
  let trendingEvents = [];
  let loading = true;
  /** @type {Array<Record<string, any>>} */
  let featuredOrgs = [];
  let loadingOrgs = true;
  let searchInput = "";
  let searching = false;
  let showNotFoundModal = false;
  let notFoundMessage = "";
  /** @type {Record<string, number>} */
  let categoryCounts = {
    academic: 0,
    careers: 0,
    workshops: 0,
    fun: 0,
    worship: 0,
  };

  /** @param {unknown} value */
  function normalizeCategory(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  /** @param {Record<string, any>} eventData */
  function getEventCategorySlugs(eventData) {
    const rawCategories = [];

    if (Array.isArray(eventData.categories))
      rawCategories.push(...eventData.categories);
    if (Array.isArray(eventData.CATEGORIES))
      rawCategories.push(...eventData.CATEGORIES);
    if (typeof eventData.category === "string")
      rawCategories.push(eventData.category);
    if (typeof eventData.CATEGORY === "string")
      rawCategories.push(eventData.CATEGORY);

    const splitValues = rawCategories
      .flatMap((value) => String(value).split(","))
      .map((value) => normalizeCategory(value))
      .filter(Boolean);

    return [...new Set(splitValues)];
  }

  /** @param {SubmitEvent} event */
  async function submitSearch(event) {
    event.preventDefault();

    const input = searchInput.trim();
    if (!input || searching) return;

    searching = true;

    try {
      const result = await findBestSearchMatch(input, { scope: "all" });

      if (result.found && result.path) {
        goto(result.path);
        return;
      }

      notFoundMessage = `"${input}" not found. Please refine your search and try again.`;
      showNotFoundModal = true;
    } finally {
      searching = false;
    }
  }

  function closeNotFoundModal() {
    showNotFoundModal = false;
  }

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

      // 3. Query: Get the 3 newest events
      // (You can change '3' to however many cards you want to show)
      const q = query(eventsRef, orderBy("createdAt", "desc"), limit(3));

      const snapshot = await getDocs(q);

      trendingEvents = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });

      const allEvents = await fetchEvents({ mode: "all" });
      /** @type {Record<string, number>} */
      const nextCounts = {
        academic: 0,
        careers: 0,
        workshops: 0,
        fun: 0,
        worship: 0,
      };

      for (const eventData of allEvents) {
        const slugs = getEventCategorySlugs(eventData);
        for (const slug of slugs) {
          if (Object.hasOwn(nextCounts, slug)) {
            nextCounts[slug] += 1;
          }
        }
      }

      categoryCounts = nextCounts;

      featuredOrgs = await fetchOrgs({ mode: "featured", limitCount: 4 });
      loadingOrgs = false;
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
      <form class="homeSearch" onsubmit={submitSearch}>
        <div class="homeSearchInputWrap">
          <input
            type="search"
            name="search"
            id="search"
            placeholder="Find your next adventure..."
            bind:value={searchInput}
          />
          <button
            type="submit"
            class="homeSearchIconButton"
            aria-label="Search"
            disabled={searching}
          >
            <Icon
              icon="material-symbols:search-rounded"
              width="24"
              height="24"
              style="color: currentColor"
            />
          </button>
        </div>
      </form>
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
      <a href="/category/academic" class="categoryCard">
        <Icon
          icon="solar:square-academic-cap-bold"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Academic</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />{categoryCounts.academic} events</span
        >
      </a>
      <a href="/category/careers" class="categoryCard">
        <Icon
          icon="tabler:briefcase"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Careers</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />{categoryCounts.careers} events</span
        >
      </a>
      <a href="/category/workshops" class="categoryCard">
        <Icon
          icon="grommet-icons:workshop"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Workshops</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />{categoryCounts.workshops} events</span
        >
      </a>
      <a href="/category/fun" class="categoryCard">
        <Icon
          icon="lucide:party-popper"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Fun</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />{categoryCounts.fun} events</span
        >
      </a>
      <a href="/category/worship" class="categoryCard">
        <Icon
          icon="fa7-solid:pray"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Worship</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />{categoryCounts.worship} events</span
        >
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
  <!-- <div class="organizations">
    <h2 class="heading">Featured Organizations</h2>
    <div class="orgCards">
      <Org />
      <Org />
      <Org />
      <Org />
      <Org />
      <Org />
    </div>
    <div class="more">
      <a id="more" href="/organizations">More Organizations</a>
    </div>
  </div> -->

  <SearchNotFoundModal
    open={showNotFoundModal}
    message={notFoundMessage}
    onClose={closeNotFoundModal}
  />
</main>
