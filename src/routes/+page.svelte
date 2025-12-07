<script>
  import "./home.css";
  import { Event } from "$lib";

  import { Org } from "$lib";
  import "../global.css";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import { db, fetchEvents, fetchOrgs } from "$lib/firebase";
  import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

  let trendingEvents = [];
  let loading = true;
  let featuredOrgs = [];
  let loadingOrgs = true;

  onMount(async () => {
    try {
      const eventsRef = collection(db, "events");
      
      // 3. Query: Get the 3 newest events
      // (You can change '3' to however many cards you want to show)
      const q = query(
        eventsRef, 
        orderBy("createdAt", "desc"), 
        limit(3)
      );
      
      const snapshot = await getDocs(q);
      
      trendingEvents = snapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() };
      });

      featuredOrgs = await fetchOrgs({ mode: 'featured', limitCount: 4 });
      loadingOrgs = false;

    } catch (err) {
      console.error("Error loading trending events:", err);
    } finally {
      loading = false;
    }
  });
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
    <!-- <div class="trendingEventCards">
      <Event />
      <Event />
      <Event />
    </div> -->
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

  <div class="category">
    <h2 class="heading">Browse by Category</h2>
    <div class="categories">
      <a href="/events?category=academic" class="categoryCard">
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
          />18 events</span
        >
      </a>
      <a href="/events?category=careers" class="categoryCard">
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
          />18 events</span
        >
      </a>
      <a href="/events?category=worksohps" class="categoryCard">
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
          />18 events</span
        >
      </a>
      <a href="/events?category=fun" class="categoryCard">
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
          />18 events</span
        >
      </a>
      <a href="/events?category=worship" class="categoryCard">
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
          />18 events</span
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
</main>
