<script>
    import './eventCard.css';
    import { goto } from '$app/navigation'; // Needed for navigation
    import { page } from '$app/stores';
    import Icon from '@iconify/svelte';
    import { doc, deleteDoc } from "firebase/firestore";
    import { db } from "$lib/firebase";
    // Receive the event object AND an optional isAdmin boolean
    let { event, isAdmin = false } = $props();

    let currentOrgId = $derived($page.url.searchParams.get('orgId'));

    /**
    * @param {string | Date} dateString
    */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    // Handlers for Admin Actions
    function handleEdit() {
        // Navigate to your edit page (we will build this later)
       goto(`/adminEditEvent?id=${event.id}&orgId=${event.ORG_ID || event.orgId}`);
    }

    async function handleDelete() {
  // 1. Confirm intention
  if (!confirm(`Are you sure you want to delete "${event.TITLE}"? This cannot be undone.`)) {
    return;
  }

  try {
    // 2. Delete the Document
    // Since the Base64 image is just a field inside this doc, 
    // it gets deleted automatically along with the title, date, etc.
    await deleteDoc(doc(db, "events", event.id));
    
    alert("Event deleted successfully.");
    // Wait 2 seconds before reloading to allow UI feedback
    setTimeout(() => {
      window.location.reload();
    }, 2000);

  } catch (err) {
    console.error("Error deleting event:", err);
    alert("Failed to delete event: " + err.message);
  }
}
</script>

<div class="card">
  <div class="image-container">
    <img src={event.IMAGE_URL} alt={event.TITLE} />
  </div>

  <div class="content">
    <h3>{event.TITLE}</h3>

    <div class="info-row">
      <Icon
        icon="uiw:date"
        class="margin"
        width="16"
        height="16"
      />
      <span>{formatDate(event.formattedDate || event.DATE)}</span>
    </div>

    <div class="info-row">
      <Icon
        icon="tabler:clock"
        class="margin"
        width="16"
        height="16"
      />
      <span>{event.START_TIME} - {event.END_TIME}</span>
    </div>

    <div class="info-row">
      <Icon
        icon="mingcute:location-fill"
        class="margin"
        width="16"
        height="16"
      />
      <span>{event.LOCATION}</span>
    </div>

    {#if !isAdmin}
        <div class="info-row org-row">
        <Icon
        icon="ion:people"
        class="margin"
        width="16"
        height="16"
      />
        <span class="org-name">{event.orgName}</span>
        </div>
    {/if}

    <div class="actions">
        {#if isAdmin}
            <button class="btn-primary" onclick={handleEdit}>Edit Event</button>
            <button class="btn-outline delete-btn" onclick={handleDelete}>Delete Event</button>
        {:else}
            <button class="btn-outline">Add to My Events</button>
            <button class="btn-outline">Learn more</button>
        {/if}
    </div>
  </div>
</div>