<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  
  // Reuse the CSS from the new event page
  import "../adminNewEvent/adminNewEvent.css";
  
  // Components
  import EventCard from "$lib/eventCard/eventCard.svelte";

  // Firebase
  import { db } from "../../lib/firebase"; 
  import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

  // 1. Get Org Data from Layout
  let { data } = $props();
  let orgData = $derived(data.userOrg || {});
  
  // Get IDs from URL
  let orgId = $derived($page.url.searchParams.get('orgId'));
  let eventId = $derived($page.url.searchParams.get('id'));

  // 2. Form State
  let title = $state("");
  let date = $state("");
  let startTime = $state("");
  let endTime = $state("");
  let location = $state("");
  let description = $state("");
  
  // Image State
  let imageFile = $state(null);
  let imagePreview = $state(null); // Will hold the existing Base64 or the new one
  
  let loading = $state(true); // Start true while we fetch data
  let saving = $state(false);

  // 3. LOAD EXISTING DATA
  onMount(async () => {
    if (!eventId) {
        alert("No Event ID provided!");
        goto(`/adminHome?orgId=${orgId}`);
        return;
    }

    try {
        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const eventData = docSnap.data();
            
            // Populate State
            title = eventData.TITLE || "";
            date = eventData.DATE || "";
            startTime = eventData.START_TIME || "";
            endTime = eventData.END_TIME || "";
            location = eventData.LOCATION || "";
            description = eventData.DESCRIPTION || "";
            imagePreview = eventData.IMAGE_URL || ""; // Preload the image!
            
        } else {
            alert("Event not found!");
            goBack();
        }
    } catch (err) {
        console.error("Error fetching event:", err);
    } finally {
        loading = false;
    }
  });

  // Helper: Format Time for Preview
  function formatTime(timeString) {
    if (!timeString) return "00:00";
    const [hours, minutes] = timeString.split(':');
    const d = new Date();
    d.setHours(parseInt(hours), parseInt(minutes));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // 4. Reactive Preview Object
  let previewEvent = $derived({
    id: "preview", 
    TITLE: title || "Event Title",
    // Fix Date timezone issue
    formattedDate: date ? new Date(date + 'T12:00:00') : new Date(),
    START_TIME: formatTime(startTime) || "Start",
    END_TIME: formatTime(endTime) || "End",
    LOCATION: location || "Location",
    IMAGE_URL: imagePreview || "https://via.placeholder.com/350x180?text=Event+Image",
    orgName: orgData.name || "Your Org Name"
  });

  // 5. Handle New Image Selection
  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview = e.target.result; // Updates preview immediately
      };
      reader.readAsDataURL(file);
    }
  }

  // 6. SAVE CHANGES (Update)
  async function handleSave() {
    if (!title || !date || !location) return alert("Please fill in required fields.");
    
    saving = true;
    try {
      const eventRef = doc(db, "events", eventId);

      // Prepare Update Object
      // We don't change 'createdAt' or 'orgId' usually
      const updatedData = {
        TITLE: title,
        DATE: date,
        START_TIME: startTime,
        END_TIME: endTime,
        LOCATION: location,
        DESCRIPTION: description,
        IMAGE_URL: imagePreview, // Will be the old Base64 OR the new one
        updatedAt: serverTimestamp()
      };

      await updateDoc(eventRef, updatedData);

      alert("Event Updated Successfully!");
      goBack();

    } catch (err) {
      console.error(err);
      alert("Error updating event: " + err.message);
    } finally {
      saving = false;
    }
  }

  function goBack() {
    // Navigate back to the calendar or dashboard
    goto(`/adminEventCalendar?orgId=${orgId}`);
  }
</script>

<div class="split-page-container">
  
  <div class="form-section">
    <div class="header">
        <h1>Edit Event</h1>
        <p>Update the details below.</p>
    </div>

    {#if loading}
        <p>Loading event details...</p>
    {:else}
        <form class="event-form" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
        
        <div class="form-group">
            <label for="imgUpload">Event Image</label>
            <input 
                type="file" 
                id="imgUpload" 
                accept="image/*" 
                onchange={handleImageSelect}
            />
            {#if imagePreview}
                <small style="color: #666;">Current image loaded. Choose file to replace.</small>
            {/if}
        </div>

        <div class="form-group">
            <label for="title">Event Title</label>
            <input type="text" id="title" bind:value={title} required />
        </div>

        <div class="row">
            <div class="form-group half">
                <label for="date">Date</label>
                <input type="date" id="date" bind:value={date} required />
            </div>
            <div class="form-group quarter">
                <label for="start">Start</label>
                <input type="time" id="start" bind:value={startTime} step="900" required />
            </div>
            <div class="form-group quarter">
                <label for="end">End</label>
                <input type="time" id="end" bind:value={endTime} step="900" required />
            </div>
        </div>

        <div class="form-group">
            <label for="location">Location</label>
            <input type="text" id="location" bind:value={location} required />
        </div>

        <div class="form-group">
            <label for="desc">Description / Notes</label>
            <textarea id="desc" bind:value={description} rows="4"></textarea>
        </div>

        <div class="button-row">
            <button type="button" class="cancel-btn" onclick={goBack} disabled={saving}>
                Cancel
            </button>
            <button type="submit" class="submit-btn" disabled={saving}>
                {#if saving} Saving... {:else} Save Changes {/if}
            </button>
        </div>

        </form>
    {/if}
  </div>

  <div class="preview-section">
    <div class="preview-sticky">
        <h2>Live Preview</h2>
        <p class="preview-sub">See your changes in real-time.</p>
        
        <div class="card-wrapper">
            <EventCard event={previewEvent} isAdmin={true} />
        </div>
    </div>
  </div>

</div>

<style>
    /* Add this specific style for the button row, rest comes from import */
    .button-row {
        display: flex;
        gap: 15px;
        margin-top: 20px;
    }

    .submit-btn {
        flex: 2;
        background-color: #2CA58D;
        color: white;
        border: none;
        padding: 15px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
    }

    .cancel-btn {
        flex: 1;
        background-color: transparent;
        border: 2px solid #ccc;
        color: #666;
        padding: 15px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
    }
    
    .cancel-btn:hover {
        background-color: #f0f0f0;
        border-color: #999;
    }
</style>