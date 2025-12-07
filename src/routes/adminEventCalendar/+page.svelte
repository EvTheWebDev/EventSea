<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import './adminEventCalendar.css';
  
  // Firebase Imports
  import { db } from "$lib/firebase"; 
  import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

  let { data } = $props(); // We don't use this anymore, but good to keep
  
  // State
  let events = $state([]); 
  let loading = $state(true);
  
  // Get Org ID from URL
  let currentOrgId = $derived($page.url.searchParams.get('orgId'));

  onMount(async () => {
    if (currentOrgId) {
        await loadEvents(currentOrgId);
    } else {
        loading = false;
    }
  });

  async function loadEvents(orgId) {
    try {
        console.log("Fetching events for Org:", orgId);
        
        const eventsRef = collection(db, "events");
        
        // --- DEBUGGING QUERY ---
        // 1. Try matching "orgId" (camelCase)
        // If your DB uses ORG_ID, change this string to "ORG_ID"
        const q = query(
            eventsRef, 
            where("ORG_ID", "==", orgId), // <--- CHECK THIS FIELD NAME
            orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(q);
        
        // Map the docs to an array
        events = snapshot.docs.map(doc => {
            return { id: doc.id, ...doc.data() };
        });

        console.log("Events Found:", events.length);

    } catch (err) {
        console.error("Error loading events:", err);
    } finally {
        loading = false;
    }
  }
</script>

<div class="calendar-container">
  
  <div class="topRow">
    <h1>Admin Event Calendar</h1>
    <div class="addEventButton">
      <a href="/adminNewEvent?orgId={currentOrgId}">
        <button class="btn-primary">+ Add New Event</button>
      </a>
    </div>
  </div>
  
  {#if loading}
    <p class="status-msg">Loading calendar...</p>
  {:else if events.length > 0}
    <div class="events-grid">
      {#each events as event}
        <EventCard {event} isAdmin={true}/>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <h3>No events found.</h3>
      <p>You better hop to it and create one!</p>
    </div>
  {/if}

</div>