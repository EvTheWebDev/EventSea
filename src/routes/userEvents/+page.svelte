<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import { fetchEvents, auth } from "$lib/firebase";
  import "../../global.css";
  import "../saved.css";

  let myEvents = [];
  let loading = true;

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        myEvents = await fetchEvents({ mode: "myEvents", userId: user.uid });
        loading = false;
      } else {
        goto("/login");
      }
    });
    return unsubscribe;
  });

  function handleRsvpUpdate(event) {
    const { status, id } = event.detail;
    if (status === false) {
      myEvents = myEvents.filter((e) => e.id !== id);
    }
  }
</script>

<main></main>
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
