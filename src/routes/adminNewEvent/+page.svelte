<!-- <script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import './adminNewEvent.css';
  
  // Components
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import Icon from "@iconify/svelte";

  // Firebase
  import { db } from "../../lib/firebase"; 
  import { collection, addDoc, serverTimestamp } from "firebase/firestore";

  // 1. Get Org Data from Layout (for the Nav and Org Name)
  let { data } = $props();
  let orgData = $derived(data.userOrg || {});
  let orgId = $derived(data.userOrg?.orgID || "");

  // 2. Form State
  let title = $state("");
  let date = $state("");
  let startTime = $state("");
  let endTime = $state("");
  let location = $state("");
  let description = $state(""); // Optional, for database only
  let imageFile = $state(null);
  let imagePreview = $state(null); // Base64 string for the card
  
  let loading = $state(false);

  function formatTime(timeString) {
    if (!timeString) return "00:00";
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    // This returns local time format (e.g., 2:00 PM)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // 3. Reactive Preview Object
  let previewEvent = $derived({
    id: "preview", 
    TITLE: title || "Event Title",
    
    // FIX 1: DATE
    // We append 'T12:00:00' to force the date to Noon Local Time. 
    // This prevents the "Midnight UTC = Yesterday" bug.
    formattedDate: date ? new Date(date + 'T12:00:00') : new Date(),
    
    // FIX 2: TIME
    // We use the helper function to show AM/PM in the preview
    START_TIME: formatTime(startTime) || "Start",
    END_TIME: formatTime(endTime) || "End",
    
    LOCATION: location || "Location",
    IMAGE_URL: imagePreview || "/placeholder.jpg", // Placeholder image
    orgName: orgData.name || "Your Org Name"
  });

  // 4. Handle Image Selection
  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      imageFile = file;
      // Create local preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // 5. Submit to Firebase
  async function handleSubmit() {
    if (!title || !date || !location) return alert("Please fill in required fields.");
    
    loading = true;
    try {
      // A. Prepare Data
      // Note: In a real app, you'd upload the image to Storage first and get a URL.
      // For MVP, we can save the Base64 string directly (limits size) or use a placeholder.
      const newEvent = {
        TITLE: title,
        DATE: date,
        START_TIME: startTime,
        END_TIME: endTime,
        LOCATION: location,
        DESCRIPTION: description,
        IMAGE_URL: imagePreview, // Storing base64 for now
        ORG_ID: orgId, // LINK TO THE ORG
        orgName: orgData.name,
        createdAt: serverTimestamp()
      };

      // B. Write to Firestore
      await addDoc(collection(db, "events"), newEvent);

      alert("Event Created Successfully!");
      goto(`/adminHome?orgId=${orgId}`);
      window.location.reload();

    } catch (err) {
      console.error(err);
      alert("Error creating event: " + err.message);
    } finally {
      loading = false;
    }
  }
</script>

<div class="split-page-container">
  
  <div class="form-section">
    <div class="header">
        <h1>Create New Event</h1>
        <p>Fill in the details below to add an event to your organization's calendar.</p>
    </div>

    <form class="event-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      
      <div class="form-group">
        <label for="imgUpload">Event Image</label>
        <input 
            type="file" 
            id="imgUpload" 
            accept="image/*" 
            onchange={handleImageSelect}
        />
      </div>

      <div class="form-group">
        <label for="title">Event Title</label>
        <input type="text" id="title" bind:value={title} placeholder="e.g. Annual Gala" required />
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
        <input type="text" id="location" bind:value={location} placeholder="e.g. Main Hall or 123 Street" required />
      </div>

      <div class="form-group">
        <label for="desc">Description / Notes</label>
        <textarea id="desc" bind:value={description} rows="4" placeholder="Details about the event..."></textarea>
      </div>

      <button type="submit" class="submit-btn" disabled={loading}>
        {#if loading} Publishing... {:else} Publish Event {/if}
      </button>

    </form>
  </div>

  <div class="preview-section">
    <div class="preview-sticky">
        <h2>Live Preview</h2>
        <p class="preview-sub">This is how your event will appear to users.</p>
        
        <div class="card-wrapper">
            <EventCard event={previewEvent} isAdmin={false} />
        </div>
    </div>
  </div>

</div> -->


<script>
  import { goto } from "$app/navigation";
  import EventForm from "$lib/eventForm/eventForm.svelte"; 
  import { db } from "../../lib/firebase"; 
  import { collection, addDoc, serverTimestamp } from "firebase/firestore";
  import './adminNewEvent.css';

  let { data } = $props();
  // We default to an empty object to prevent "cannot read property of undefined"
  let orgData = $derived(data.userOrg || {
      orgName: "",
      name: "",
      orgID: ""
  });
  let orgId = $derived(data.userOrg?.orgID || "");
  let saving = $state(false);

  async function handleSave(event) {
    // 1. Receive data + base64 string from component
    const { formData, finalImage } = event.detail;
    saving = true;

    try {
      // FIX 1: Robust Name Check
      // We check orgName (new) -> name (old) -> default
      const safeOrgName = orgData.orgName || orgData.name || "My Organization";
      const safeImg = finalImage || "/placeholder.jpg";
      const newEvent = {
        ...formData,
        IMAGE_URL: safeImg, 
        ORG_ID: orgId,
        
        // Use the safe variable here
        orgName: safeOrgName,
        
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "events"), newEvent);
      alert("Event Created!");
      window.location.href = `/adminHome?orgId=${orgId}`;
      
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      saving = false;
    }
  }
</script>

<EventForm 
    orgName={orgData.orgName || orgData.name || "My Organization"} 
    saving={saving}
    on:save={handleSave} 
/>