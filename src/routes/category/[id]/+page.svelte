<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";

  import { db, auth } from "$lib/firebase";
  import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
  } from "firebase/firestore";

  let event = $state(null);
  let loading = $state(true);
  let isRsvped = $state(false);
  let processing = $state(false);

  const eventId = $page.params.id;

  onMount(async () => {
    try {
      const docRef = doc(db, "events", eventId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        event = {
          id: snap.id,
          ...data,
          displayDate: formatDate(data.DATE),
          displayTime: `${formatTime(data.START_TIME)} - ${formatTime(data.END_TIME)}`,
        };

        if (
          auth.currentUser &&
          event.rsvps &&
          event.rsvps.includes(auth.currentUser.uid)
        ) {
          isRsvped = true;
        }
      } else {
        alert("Event not found");
        goto("/events");
      }
    } catch (err) {
      console.error(err);
    } finally {
      loading = false;
    }
  });

  // --- NEW HANDLER ---
  function handleViewOrg() {
    const orgId = event.ORG_ID || event.orgId;
    if (orgId) {
      goto(`/organizations/${orgId}`);
    } else {
      alert("Organization info not found for this event.");
    }
  }

  function formatTime(timeString) {
    if (!timeString) return "";
    const [h, m] = timeString.split(":");
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }

  async function toggleRSVP() {
    if (!auth.currentUser) return goto("/login");
    processing = true;
    const eventRef = doc(db, "events", event.id);

    try {
      if (isRsvped) {
        await updateDoc(eventRef, { rsvps: arrayRemove(auth.currentUser.uid) });
        isRsvped = false;
      } else {
        await updateDoc(eventRef, { rsvps: arrayUnion(auth.currentUser.uid) });
        isRsvped = true;
      }
    } catch (err) {
      alert("Error updating RSVP");
    } finally {
      processing = false;
    }
  }
</script>

<div class="nav"></div>
<div class="page-wrapper">
  <div class="nav-placeholder"></div>

  {#if loading}
    <div class="loading">Loading details...</div>
  {:else if event}
    <div class="single-event-card">
      <div class="card-header">
        <div class="image-box">
          <img
            src={event.IMAGE_URL || "https://placehold.co/600x400"}
            alt={event.TITLE}
          />
        </div>

        <div class="details-box">
          <h1>{event.TITLE}</h1>

          <div class="meta-row">
            <Icon icon="mdi:calendar" width="20" style="color: #1B065E;" />
            <span>{event.displayDate}</span>
          </div>

          <div class="meta-row">
            <Icon
              icon="mdi:clock-time-four-outline"
              width="20"
              style="color: #1B065E;"
            />
            <span>{event.displayTime}</span>
          </div>

          <div class="meta-row">
            <Icon icon="mdi:map-marker" width="20" style="color: #1B065E;" />
            <span>{event.LOCATION}</span>
          </div>

          <div class="meta-row org-link">
            <Icon icon="mdi:account-group" width="20" style="color: #A997DF;" />
            <span
              class="org-text"
              onclick={handleViewOrg}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === "Enter" && handleViewOrg()}
            >
              {event.orgName}
            </span>
          </div>
        </div>
      </div>

      <div class="description-box">
        <p>{event.DESCRIPTION || "No description provided."}</p>
      </div>

      <div class="action-row">
        <button
          class="action-btn rsvp"
          class:active={isRsvped}
          onclick={toggleRSVP}
          disabled={processing}
        >
          {isRsvped ? "✓ Going" : "Add to My Events"}
        </button>

        <button class="action-btn org" onclick={handleViewOrg}>
          View Organization
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Keep existing styles */
  .page-wrapper {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
  }

  .single-event-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.226);
    max-width: 900px;
    width: 100%;
    padding: 30px;
    font-family: "Segoe UI", sans-serif;
    margin-top: 50px;
    margin-bottom: 50px;
  }

  .card-header {
    display: flex;
    gap: 30px;
    margin-bottom: 30px;
  }
  .image-box {
    flex: 1;
    max-width: 400px;
    height: 250px;
    border-radius: 15px;
    overflow: hidden;
  }
  .image-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .details-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  h1 {
    color: #1b065e;
    font-size: 2rem;
    margin: 0 0 5px 0;
    line-height: 1.1;
  }
  .meta-row {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #666;
    font-size: 1rem;
  }

  .org-text {
    color: #a997df;
    text-decoration: underline;
    font-weight: bold;
    cursor: pointer;
  }

  .description-box {
    margin-bottom: 30px;
    color: #555;
    line-height: 1.6;
    font-size: 0.95rem;
  }

  .action-row {
    display: flex;
    gap: 20px;
    justify-content: center;
  }
  .action-btn {
    flex: 1;
    max-width: 300px;
    padding: 12px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid #1b065e;
  }

  .action-btn.rsvp {
    background: white;
    color: #1b065e;
  }
  .action-btn.rsvp:hover,
  .action-btn.rsvp.active {
    background: #1b065e;
    color: white;
  }

  .action-btn.org {
    background: white;
    color: #1b065e;
  }
  .action-btn.org:hover {
    background: #f0f0f0;
  }

  @media (max-width: 768px) {
    .card-header {
      flex-direction: column;
    }
    .image-box {
      max-width: 100%;
      height: 200px;
    }
    .action-row {
      flex-direction: column;
    }
    .action-btn {
      max-width: 100%;
    }
  }
</style>
