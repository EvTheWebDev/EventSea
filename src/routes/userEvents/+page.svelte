<!-- <script>
  import { Event } from "$lib";
  import "../../global.css";
  import "../saved.css";
  import Icon from "@iconify/svelte";
</script>

<main class="savedPage">
  <div class="nav"></div>
  <div class="savedContent">
    <h2 class="heading">Your Saved Events</h2>
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
    <div class="savedItems">
      <p>You currently have no saved events. Let's go add some!</p>
    </div>
  </div>
</main> -->


<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import { fetchEvents, auth } from "$lib/firebase"; 

  let myEvents = [];
  let loading = true;

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        myEvents = await fetchEvents({ mode: 'myEvents', userId: user.uid });
        loading = false;
      } else {
        goto('/login');
      }
    });
    return unsubscribe;
  });

  function handleRsvpUpdate(event) {
    const { status, id } = event.detail;
    if (status === false) {
        myEvents = myEvents.filter(e => e.id !== id);
    }
  }
</script>

<div class="nav"></div>
<div class="page-container">
  <h1>My Events</h1>
  <p class="subtitle">Events you have RSVP'd to.</p>

  {#if loading}
    <div class="status">Loading your schedule...</div>
  {:else if myEvents.length > 0}
    <div class="events-grid">
      {#each myEvents as event (event.id)}
        <EventCard {event} on:toggle={handleRsvpUpdate} />
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <h3>You haven't joined any events yet.</h3>
      <a href="/events" class="browse-link">Browse All Events →</a>
    </div>
  {/if}
</div>

<style>
  .page-container { padding: 40px; max-width: 1200px; margin: 0 auto; }
  h1 { color: #1B065E; margin-bottom: 10px; }
  .subtitle { margin-bottom: 40px; color: #666; }
  
  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 30px;
  }
  
  .status { text-align: center; padding: 50px; color: #888; }
  
  .empty-state {
    text-align: center;
    background: #f9f9f9;
    padding: 60px;
    border-radius: 12px;
  }
  .browse-link {
    display: inline-block;
    margin-top: 20px;
    color: #2CA58D;
    font-weight: bold;
    text-decoration: none;
  }
</style>