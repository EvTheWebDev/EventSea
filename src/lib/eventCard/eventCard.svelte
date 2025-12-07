<script>
    import './eventCard.css';
    import { goto } from '$app/navigation';
    import { createEventDispatcher } from 'svelte';
    import Icon from '@iconify/svelte';
    import { db, auth } from "$lib/firebase"; 
    import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";

    let { event, isAdmin = false } = $props();

    const dispatch = createEventDispatcher();
    let currentUser = auth.currentUser;
    let isRsvped = $state(
        currentUser && event.rsvps && event.rsvps.includes(currentUser.uid)
    );

    let processing = $state(false);

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    async function toggleRSVP() {
        if (!currentUser) {
            alert("Please log in to join events.");
            goto("/login");
            return;
        }
        processing = true;
        const eventRef = doc(db, "events", event.id);
        try {
            if (isRsvped) {
                await updateDoc(eventRef, { rsvps: arrayRemove(currentUser.uid) });
                isRsvped = false;
                dispatch('toggle', { status: false, id: event.id });
            } else {
                await updateDoc(eventRef, { rsvps: arrayUnion(currentUser.uid) });
                isRsvped = true;
                dispatch('toggle', { status: true, id: event.id });
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update RSVP");
        } finally {
            processing = false;
        }
    }

    function handleEdit() {
        goto(`/adminEditEvent?id=${event.id}&orgId=${event.ORG_ID || event.orgId}`); 
    }

    function handleLearnMore() {
        goto(`/events/${event.id}`);
    }

    // --- NEW FUNCTION: Route to Org Page ---
    function handleViewOrg() {
        const orgId = event.ORG_ID || event.orgId;
        if (orgId) {
            goto(`/organizations/${orgId}`);
        } else {
            console.warn("No Org ID linked to this event");
        }
    }

    async function handleDelete() {
        if (!confirm(`Delete "${event.TITLE}"?`)) return;
        try {
            await deleteDoc(doc(db, "events", event.id));
            window.location.reload();
        } catch (err) { alert(err.message); }
    }
</script>

<div class="card">
  <div class="image-container">
    <img 
      src={event.IMAGE_URL || "https://placehold.co/600x400?text=Event+Image"} 
      alt={event.TITLE} 
    />
  </div>

  <div class="content">
    <h3>{event.TITLE}</h3>

    <div class="info-row">
      <Icon icon="mdi:calendar" width="20" height="20" style="color: #666;" />
      <span>{formatDate(event.formattedDate || event.DATE)}</span>
    </div>

    <div class="info-row">
      <Icon icon="mdi:clock-time-four-outline" width="20" height="20" style="color: #666;" />
      <span>{event.START_TIME} - {event.END_TIME}</span>
    </div>

    <div class="info-row">
      <Icon icon="mdi:map-marker" width="20" height="20" style="color: #666;" />
      <span>{event.LOCATION}</span>
    </div>

    {#if !isAdmin}
        <div class="info-row org-row">
            <Icon icon="mdi:account-group" width="20" height="20" style="color: #A997DF;" />
            <span 
                class="org-name clickable" 
                role="button" 
                tabindex="0" 
                onkeydown={(e) => e.key === 'Enter' && handleViewOrg()}
                onclick={handleViewOrg}
            >
                {event.orgName}
            </span>
        </div>
    {/if}

    <div class="actions">
        {#if isAdmin}
            <button class="btn-primary" onclick={handleEdit}>Edit</button>
            <button class="btn-outline delete-btn" onclick={handleDelete}>Delete</button>
        {:else}
            <button 
                class={isRsvped ? "btn-primary" : "btn-outline"} 
                onclick={toggleRSVP}
                disabled={processing}
            >
                {#if processing} ... {:else if isRsvped} ✓ Going {:else} + Add to My Events {/if}
            </button>
            
            <button class="btn-outline" onclick={handleLearnMore}>Learn more</button>
        {/if}
    </div>
  </div>
</div>

<style>
    /* Add this to ensure users know they can click the name */
    .clickable {
        cursor: pointer;
    }
    .clickable:hover {
        text-decoration: underline; /* Optional hover effect */
    }

    .btn-primary {
        flex: 1;
        padding: 10px;
        border: 2px solid #1B065E;
        background: #1B065E;
        color: white;
        border-radius: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }
</style>