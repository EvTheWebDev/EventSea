<!-- <script>
    import { onMount } from "svelte";
    import { page } from '$app/stores'; // Needed to read URL params
    import { goto } from "$app/navigation";
    import EventCard from "$lib/eventCard/eventCard.svelte";
    import './adminHome.css';

    // 1. Grab data passed from the server load function (if any)
    let { data } = $props();
    
    // 2. Local State variables
    let upcomingEvents = data.upcomingEvents || []; // Fallback empty array
    let orgStats = data.orgStats || { followers: 0, rsvps: 0, orgName: "Loading..." };
    
    // 3. Store the current Org ID
    let currentOrgId = $state("");

    onMount(() => {
        // 4. Extract 'orgId' from the URL query parameters
        currentOrgId = $page.url.searchParams.get('orgId');

        if (!currentOrgId) {
            console.warn("No Org ID found in URL. Redirecting to login...");
            goto("/adminLogin");
        } else {
            console.log("Admin Dashboard Active for Org ID:", currentOrgId);
            
            // OPTIONAL: If your data isn't coming from +page.server.js, 
            // you would trigger a fetch function here using currentOrgId
            // e.g., loadOrgData(currentOrgId);
        }
    });

    // Reactive destructuring for easier display
    let { followers, rsvps, orgName } = orgStats; 
</script>

<div class="dashboard-container">
  
  <header>
    <h1>Welcome, {orgName}!</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number">{followers}</span>
        <span class="stat-label">Total Followers</span>
        <button class="btn-primary">View List</button>
      </div>

      <div class="stat-card">
        <span class="stat-number">{rsvps}</span>
        <span class="stat-label">Event RSVPs</span>
        <button class="btn-primary">View List</button>
      </div>
    </div>
  </header>

<section class="wave-banner">
  <div class="wave-shape top">
    <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path fill="#A997DF" fill-opacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
  </div>

  <div class="banner-content">
    <h2>Make Some Waves</h2>
    <div class="banner-actions">
      <button class="btn-banner" onclick={() => goto(`/createEvent?orgId=${currentOrgId}`)}>Create a New Event</button>
      <button class="btn-banner">Share an Announcement</button>
    </div>
  </div>
  
  <div class="wave-shape bottom">
    <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#A997DF" fill-opacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
  </div>
</section>

  <section class="events-section">
    <h3>Your Upcoming Events</h3>
    
    <div class="events-grid">
      {#if upcomingEvents.length > 0}
          {#each upcomingEvents as event}
            <EventCard {event} isAdmin={true}/>
          {/each}
      {:else}
          <p>No events found. Time to make some waves!</p>
      {/if}
    </div>
  </section>

</div> -->

<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores'; 
    import { goto } from "$app/navigation";
    // Adjust these paths if your folder structure is different
    import EventCard from "$lib/eventCard/eventCard.svelte";
    import { adminOrgData } from "$lib/adminStore"; 
    import { db } from "$lib/firebase"; 
    import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
    
    import './adminHome.css';

    // Local State
    let currentOrgId = $state("");
    let loading = $state(true);

    onMount(async () => {
        // 1. Get ID from URL
        const urlOrgId = $page.url.searchParams.get('orgId');

        if (!urlOrgId) {
            console.warn("No Org ID found. Redirecting to login...");
            goto("/adminLogin");
            return;
        }
        
        currentOrgId = urlOrgId;

        // 2. CHECK THE STORE (Cache Strategy)
        // If data is loaded AND matches the current Org ID, use it to save reads.
        if ($adminOrgData.isLoaded && $adminOrgData.orgId === currentOrgId) {
            console.log("⚡ Using cached data from Store");
            loading = false;
        } else {
            console.log("🔄 Fetching fresh data from Firebase...");
            await loadData(currentOrgId);
        }
    });

    async function loadData(id) {
        try {
            loading = true;

            // A. Fetch Org Profile
            const orgRef = doc(db, "orgs", id);
            const orgSnap = await getDoc(orgRef);
            
            const orgName = orgSnap.exists() ? orgSnap.data().orgName : "Unknown Org";
            const followers = orgSnap.exists() ? (orgSnap.data().followers || 0) : 0;
            const rsvps = orgSnap.exists() ? (orgSnap.data().rsvps || 0) : 0;

            // B. Fetch Events
            // CRITICAL: Ensure your Firestore document has a field named exactly "orgId"
            const eventsRef = collection(db, "events");
            const q = query(eventsRef, where("ORG_ID", "==", id)); 
            
            const querySnapshot = await getDocs(q);
            
            const fetchedEvents = [];
            querySnapshot.forEach((doc) => {
                // We spread the data and ensure the ID is included
                fetchedEvents.push({ id: doc.id, ...doc.data() });
            });

            // DEBUG LOG: Check your console to see what we actually found
            console.log(`Query found ${fetchedEvents.length} events for Org ID: ${id}`);
            if(fetchedEvents.length > 0) console.log("First event sample:", fetchedEvents[0]);

            // C. Update the Store
            adminOrgData.set({
                isLoaded: true,
                orgId: id,
                stats: { 
                    followers: followers, 
                    rsvps: rsvps, 
                    orgName: orgName 
                },
                events: fetchedEvents
            });

        } catch (error) {
            console.error("Error loading admin data:", error);
            alert("Failed to load dashboard data. Check console for details.");
        } finally {
            loading = false;
        }
    }
</script>

<div class="dashboard-container">
  
  <header>
    <h1>Welcome, {$adminOrgData.stats.orgName}!</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number">{$adminOrgData.stats.followers}</span>
        <span class="stat-label">Total Followers</span>
        <button class="btn-primary">View List</button>
      </div>

      <div class="stat-card">
        <span class="stat-number">{$adminOrgData.stats.rsvps}</span>
        <span class="stat-label">Event RSVPs</span>
        <button class="btn-primary">View List</button>
      </div>
    </div>
  </header>

  <section class="wave-banner">
    <div class="wave-shape top">
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#A997DF" fill-opacity="1" d="M0,192L60,186.7C120,181,240,171,360,176C480,181,600,203,720,208C840,213,960,203,1080,186.7C1200,171,1320,149,1380,138.7L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
      </svg>
    </div>

    <div class="banner-content">
      <h2>Make Some Waves</h2>
      <div class="banner-actions">
        <button class="btn-banner" onclick={() => goto(`/adminNewEvent?orgId=${currentOrgId}`)}>Create a New Event</button>
        <button class="btn-banner">Share an Announcement</button>
      </div>
    </div>
    
    <div class="wave-shape bottom">
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#A997DF" fill-opacity="1" d="M0,192L60,186.7C120,181,240,171,360,176C480,181,600,203,720,208C840,213,960,203,1080,186.7C1200,171,1320,149,1380,138.7L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
      </svg>
    </div>
  </section>

  <section class="events-section">
    <h3>Your Upcoming Events</h3>
    
    <div class="events-grid">
      {#if loading}
        <p>Loading your events...</p>
      {:else if $adminOrgData.events && $adminOrgData.events.length > 0}
          {#each $adminOrgData.events as event}
            <EventCard {event} isAdmin={true} />
          {/each}
      {:else}
          <p>No events found. Time to make some waves!</p>
      {/if}
    </div>
  </section>

</div>