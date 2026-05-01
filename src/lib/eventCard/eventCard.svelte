<script>
  import "./eventCard.css";
  import { goto } from "$app/navigation";
  import { promptLogin } from "../../store/authModal.js";
  import { createEventDispatcher } from "svelte";
  import Icon from "@iconify/svelte";
  import { db, auth } from "$lib/firebase";
  import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    deleteDoc,
  } from "firebase/firestore";

  let { event, isAdmin = false } = $props();

  const dispatch = createEventDispatcher();
  let currentUser = auth.currentUser;
  let isRsvped = $state(
    currentUser && event.rsvps && event.rsvps.includes(currentUser.uid),
  );

  let processing = $state(false);
  let showDeleteModal = $state(false);

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }

  async function toggleRSVP() {
    if (!currentUser) {
      promptLogin();
      return;
    }
    processing = true;
    const eventRef = doc(db, "events", event.id);
    try {
      if (isRsvped) {
        await updateDoc(eventRef, { rsvps: arrayRemove(currentUser.uid) });
        isRsvped = false;
        dispatch("toggle", { status: false, id: event.id });
      } else {
        await updateDoc(eventRef, { rsvps: arrayUnion(currentUser.uid) });
        isRsvped = true;
        dispatch("toggle", { status: true, id: event.id });
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

  function handleViewOrg() {
    const orgId = event.ORG_ID || event.orgId;
    if (orgId) {
      goto(`/organizations/${orgId}`);
    } else {
      console.warn("No Org ID linked to this event");
    }
  }

  function promptDelete() {
    showDeleteModal = true;
  }

  async function confirmDelete() {
    processing = true;
    try {
      await deleteDoc(doc(db, "events", event.id));
      showDeleteModal = false;
      window.location.reload();
    } catch (err) {
      alert(err.message);
      processing = false;
    }
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
      <Icon
        icon="mdi:clock-time-four-outline"
        width="20"
        height="20"
        style="color: #666;"
      />
      <span>{event.START_TIME} - {event.END_TIME}</span>
    </div>

    <div class="info-row">
      <Icon icon="mdi:map-marker" width="20" height="20" style="color: #666;" />
      <span>{event.LOCATION}</span>
    </div>

    {#if !isAdmin}
      <div class="info-row org-row">
        <Icon
          icon="mdi:account-group"
          width="20"
          height="20"
          style="color: #A997DF;"
        />
        <span
          class="org-name clickable"
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === "Enter" && handleViewOrg()}
          onclick={handleViewOrg}
        >
          {event.orgName}
        </span>
      </div>
    {/if}

    <div class="actions">
      {#if isAdmin}
        <button class="btn-primary" onclick={handleEdit}>Edit</button>
        <button class="btn-outline delete-btn" onclick={promptDelete}>Delete</button>
      {:else}
        <button
          class={isRsvped ? "btn-primary" : "btn-outline"}
          onclick={toggleRSVP}
          disabled={processing}
        >
          {#if processing}
            ...
          {:else if isRsvped}
            ✓ Going
          {:else}
            + Add to My Events
          {/if}
        </button>

        <button class="btn-outline" onclick={handleLearnMore}>Learn more</button>
      {/if}
    </div>
  </div>
</div>

{#if showDeleteModal}
  <div class="delete-modal-overlay">
    <div class="delete-modal-content">
      <h3>Delete Event?</h3>
      <p>Are you sure you want to delete <strong>"{event.TITLE}"</strong>? This action cannot be undone.</p>
      
      <div class="delete-modal-actions">
        <button 
          class="btn-outline" 
          onclick={() => showDeleteModal = false} 
          disabled={processing}
        >
          Cancel
        </button>
        <button 
          class="btn-danger" 
          onclick={confirmDelete} 
          disabled={processing}
        >
          {processing ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .clickable {
    cursor: pointer;
  }
  .clickable:hover {
    text-decoration: underline; 
  }

  .btn-primary {
    flex: 1;
    padding: 10px;
    border: 2px solid #1b065e;
    background: #1b065e;
    color: white;
    border-radius: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }

  /* --- DELETE MODAL STYLES --- */
  .delete-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .delete-modal-content {
    background: white;
    padding: 24px;
    border-radius: 12px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }

  .delete-modal-content h3 {
    margin-top: 0;
    color: #1b065e;
    font-size: 1.5rem;
  }

  .delete-modal-content p {
    color: #555;
    margin-bottom: 24px;
    line-height: 1.5;
  }

  .delete-modal-actions {
    display: flex;
    gap: 12px;
  }

  .btn-danger {
    flex: 1;
    padding: 10px;
    border: 2px solid #a40000;
    background: #a40000;
    color: white;
    border-radius: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-danger:hover:not(:disabled) {
    background: #cc0000;
    border-color: #cc0000;
  }

  .btn-danger:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>