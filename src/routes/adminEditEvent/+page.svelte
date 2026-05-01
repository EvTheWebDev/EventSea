<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  // IMPORT THE NEW COMPONENT!
  import EventForm from "$lib/eventForm/eventForm.svelte";

  // Firebase
  import { db } from "../../lib/firebase";
  import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

  // 1. Get Org Data from Layout
  let { data } = $props();
  let orgData = $derived(data.userOrg || {});

  // Get IDs from URL
  let orgId = $derived($page.url.searchParams.get("orgId"));
  let eventId = $derived($page.url.searchParams.get("id"));

  let loading = $state(true); 
  let saving = $state(false);
  let initialData = $state({}); // This will hold the fetched event data

  // 2. FETCH EXISTING DATA
  onMount(async () => {
    if (!eventId) {
      alert("No Event ID provided!");
      loading = false;
      return;
    }

    try {
      const docRef = doc(db, "events", eventId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const eventData = docSnap.data();
        
        // Package the data up to send to the form.
        // We include the ID so the form knows it is in "Edit" mode.
        initialData = { id: eventId, ...eventData }; 
      } else {
        alert("Event not found!");
      }
    } catch (err) {
      console.error("Error fetching event:", err);
    } finally {
      loading = false;
    }
  });

  // 3. SAVE CHANGES (Update)
  async function handleSave(e) {
    // The form packages all the user inputs and the image for us!
    const { formData, finalImage } = e.detail;
    
    saving = true;
    try {
      const eventRef = doc(db, "events", eventId);

      // Prepare Update Object
      const updatedData = {
        ...formData, // Spreads TITLE, DATE, LOCATION, CATEGORIES, etc.
        IMAGE_URL: finalImage,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(eventRef, updatedData);

      alert("Event Updated Successfully!");
      // Send them back to the calendar after a successful edit
      goto(`/adminEventCalendar?orgId=${orgId}`);
      
    } catch (err) {
      console.error(err);
      alert("Error updating event: " + err.message);
    } finally {
      saving = false;
    }
  }
</script>

{#if loading}
  <div class="loading-state">
    <h2>Loading event details...</h2>
  </div>
{:else}
 <EventForm 
    {initialData} 
    
    orgName={initialData.orgName || orgData.name || "Your Org"} 
    
    {loading} 
    {saving} 
    on:save={handleSave} 
  />
{/if}

<style>
  .loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    font-family: 'Mont-Semi', sans-serif;
    color: #1B065E;
  }
</style>