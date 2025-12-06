<!-- <script>
    import './adminEventCalendar.css';
    import {AdminNav} from "$lib"
  import AdminFooter from '$lib/adminFooter/adminFooter.svelte';
</script>

<div class="pageContent">
    <h1>Event Calendar</h1>
</div> -->


<script>
  import EventCard from "$lib/eventCard/eventCard.svelte";
  
  // 1. Get the data prop (Svelte 5 syntax)
  let { data } = $props();
</script>

<div class="calendar-container">
  <h1>Admin Event Calendar</h1>

  {#if data.events && data.events.length > 0}
    <div class="events-grid">
      {#each data.events as event}
        <EventCard {event} />
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <p>No events found in the database.</p>
    </div>
  {/if}
</div>

<style>
  .calendar-container {
    padding: 2rem;
  }
  
  .events-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 20px;
  }
  
  .empty-state {
    text-align: center;
    color: #666;
    margin-top: 50px;
  }
</style>