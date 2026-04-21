<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores'; 
    import { goto } from "$app/navigation";
    // Adjust these paths if your folder structure is different
    import EventCard from "$lib/eventCard/eventCard.svelte";
    import { adminOrgData } from "$lib/adminStore"; 
  import { db, auth, checkUserAdminStatus } from "$lib/firebase"; 
  import { onAuthStateChanged } from "firebase/auth";    
  import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
    
    import './adminHome.css';

    // Local State
    let currentOrgId = $state("");
    let loading = $state(true);

    onMount(() => {
        // 1. Get ID from URL
        const urlOrgId = $page.url.searchParams.get('orgId');

        if (!urlOrgId) {
            console.warn("No Org ID found. Redirecting to login...");
            goto("/adminLogin");
            return;
        }
        
        currentOrgId = urlOrgId;

        // 2. THE BOUNCER: Wait for Firebase to confirm the user's identity
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // Not logged in at all
                goto("/adminLogin");
                return;
            }

            // 3. CHECK THE GUEST LIST: Do they manage THIS exact organization?
            const managedOrgs = await checkUserAdminStatus(user.uid);

            if (!managedOrgs || !managedOrgs.includes(currentOrgId)) {
                console.error("SECURITY ALERT: User attempted to access unauthorized organization.");
                alert("You do not have permission to view or edit this dashboard.");
                goto("/adminLogin");
                return;
            }

            // 4. PASSED! Let them in and load the data.
            if ($adminOrgData.isLoaded && $adminOrgData.orgId === currentOrgId) {
                console.log("⚡ Using cached data from Store");
                loading = false;
            } else {
                console.log("🔄 Fetching fresh data from Firebase...");
                await loadData(currentOrgId);
            }
        });

        // Cleanup the listener when leaving the page so it doesn't cause memory leaks
        return unsubscribe;
    });

    async function loadData(id) {
        try {
            loading = true;

            // A. Fetch Org Profile
const orgRef = doc(db, "orgs", id);
const orgSnap = await getDoc(orgRef);

let orgName = "Unknown Org";
let followers = 0;
let rsvps = 0;

if (orgSnap.exists()) {
    const data = orgSnap.data();
    orgName = data.orgName || data.name || "Unknown Org";
    
    // Check if followers is an array and get its length. Otherwise, use the number or 0.
    followers = Array.isArray(data.followers) ? data.followers.length : (data.followers || 0);
    
    // Do the exact same thing for RSVPs
    rsvps = Array.isArray(data.rsvps) ? data.rsvps.length : (data.rsvps || 0);
}

            const eventsRef = collection(db, "events");
            const q = query(eventsRef, where("ORG_ID", "==", id)); 
            
            const querySnapshot = await getDocs(q);
            
            const fetchedEvents = [];
            querySnapshot.forEach((doc) => {
                fetchedEvents.push({ id: doc.id, ...doc.data() });
            });

            // console.log(`Query found ${fetchedEvents.length} events for Org ID: ${id}`);
            // if(fetchedEvents.length > 0) console.log("First event sample:", fetchedEvents[0]);

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
        <span class="stat-label">{$adminOrgData.stats.followers === 1 ? 'Follower' : 'Followers'}</span>
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
        <button class="btn-banner" onclick={() => goto(`/adminNewEvent?orgId=${currentOrgId}`)}>New Event</button>
        <button class="btn-banner" onclick={() => goto(`/adminNewPost?orgId=${currentOrgId}`)}>New Post</button>
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