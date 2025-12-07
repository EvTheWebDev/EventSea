<!-- JEREMY's OLD PAGE (FOR STORAGE) -->
<!-- <script>
  import { Event } from "$lib";
  import "../../global.css";
  import "./events.css";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import { fetchEvents } from "$lib/firebase";
  let events = [];
  let loading = true;
</script>

<main class="eventsPage">
  <div class="nav"></div>
  <div class="eventsHero">
    <div class="eventsText">
      <h2>Your adventure starts here.</h2>
      <h1>Upcoming Events</h1>
    </div>
  </div>
  <div class="eventsContainer">
    <div class="filters">
      <div class="search">
        <Icon
          icon="material-symbols:search-rounded"
          width="24"
          height="24"
          style="color: #1b065e;margin-right: 4px"
        />
        Search
      </div>
      <div class="filter">
        <Icon
          icon="mdi:filter-outline"
          width="24"
          height="24"
          style="color: #1b065e;margin-right: 4px"
        />
        Filter
      </div>
      <div class="sort">
        <Icon
          icon="material-symbols:sort-rounded"
          width="24"
          height="24"
          style="color: #1b065e;margin-right: 4px"
        />
        Sort
      </div>
    </div>
    <div class="eventCards">
      {#if loading}
    <div class="status">Loading events...</div>
  {:else if events.length > 0}
    <div class="events-grid">
      {#each events as event}
        <EventCard {event} />
      {/each}
    </div>
  {:else}
    <div class="status">No upcoming events found.</div>
  {/if}
</div>
    </div>
</main> -->

<script>
  import "../../global.css";
  import "./events.css";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import { fetchEvents } from "$lib/firebase"; 

  let events = [];
  let loading = true;

  onMount(async () => {
    try {
        // Fetch all events 
        events = await fetchEvents({ mode: 'all' });
    } catch (err) {
        console.error("Failed to load events:", err);
    } finally {
        loading = false;
    }
  });
</script>

<main class="eventsPage">
  <div class="nav"></div> <div class="eventsHero">
    <div class="eventsText">
      <h2>Your adventure starts here.</h2>
      <h1>Upcoming Events</h1>
    </div>
  </div>

  <div class="eventsContainer">
    <div class="filters">
      <div class="search">
        <Icon icon="material-symbols:search-rounded" width="24" height="24" style="color: #1b065e;margin-right: 4px" />
        Search
      </div>
      <div class="filter">
        <Icon icon="mdi:filter-outline" width="24" height="24" style="color: #1b065e;margin-right: 4px" />
        Filter
      </div>
      <div class="sort">
        <Icon icon="material-symbols:sort-rounded" width="24" height="24" style="color: #1b065e;margin-right: 4px" />
        Sort
      </div>
    </div>

    <div class="eventCards">
      {#if loading}
        <div class="status">Loading events...</div>
      {:else if events.length > 0}
        <div class="events-grid">
          {#each events as event}
            <EventCard {event} />
          {/each}
        </div>
      {:else}
        <div class="status">No upcoming events found.</div>
      {/if}
    </div>
  </div>
</main>