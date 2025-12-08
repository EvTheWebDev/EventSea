<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import EventCard from "$lib/eventCard/eventCard.svelte";

  // Firebase Imports
  import { db, auth, fetchEvents } from "$lib/firebase";
  import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
  } from "firebase/firestore";

  // State
  let org = $state(null);
  let orgEvents = $state([]);
  let loading = $state(true);

  // Follower State
  let isFollowing = $state(false);
  let followerCount = $state(0);
  let processing = $state(false);

  // Get the ID from the folder name [id]
  const orgId = $page.params.id;

  onMount(async () => {
    try {
      // 1. Fetch Organization Data
      const docRef = doc(db, "orgs", orgId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        org = { id: snap.id, ...data };

        // FIX: Handle legacy data where 'followers' might be undefined
        const followers = data.followers || [];

        followerCount = followers.length;

        // Check if current user is following
        if (auth.currentUser && followers.includes(auth.currentUser.uid)) {
          isFollowing = true;
        }

        // 2. Fetch Events for this Org
        // Using your helper function from firebase.js
        orgEvents = await fetchEvents({ mode: "org", orgId: orgId });
      } else {
        alert("Organization not found");
        goto("/events");
      }
    } catch (err) {
      console.error("Error loading org page:", err);
    } finally {
      loading = false;
    }
  });

  async function toggleFollow() {
    if (!auth.currentUser) return goto("/login");

    processing = true;
    const orgRef = doc(db, "orgs", orgId);

    try {
      if (isFollowing) {
        // Unfollow logic
        await updateDoc(orgRef, {
          followers: arrayRemove(auth.currentUser.uid),
        });
        isFollowing = false;
        followerCount--;
      } else {
        // Follow logic
        await updateDoc(orgRef, {
          followers: arrayUnion(auth.currentUser.uid),
        });
        isFollowing = true;
        followerCount++;
      }
    } catch (err) {
      console.error(err);
      alert("Error updating follow status");
    } finally {
      processing = false;
    }
  }
</script>

<div class="nav"></div>
<div class="page-wrapper">
  <div class="nav-placeholder"></div>

  {#if loading}
    <div class="loading">Loading organization...</div>
  {:else if org}
    <div class="org-header">
      <div class="header-content">
        <img
          src={org.image || "/homeHero.png"}
          alt={org.orgName}
          class="org-logo"
        />

        <div class="header-text">
          <h1>{org.orgName || "Unnamed Organization"}</h1>

          <div class="stats-row">
            <span>Est. {org.foundedYear || "2025"}</span>
            <span class="dot">•</span>
            <span>{followerCount} Followers</span>
          </div>

          <p class="desc">{org.description || "No description provided."}</p>

          <button
            class="follow-btn"
            class:active={isFollowing}
            onclick={toggleFollow}
            disabled={processing}
          >
            {isFollowing ? "✓ Following" : "+ Follow Organization"}
          </button>
        </div>
      </div>
    </div>

    <div class="content-container">
      <h2>Upcoming Events</h2>

      {#if orgEvents.length > 0}
        <div class="events-grid">
          {#each orgEvents as event}
            <EventCard {event} />
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <p>This organization hasn't posted any events yet.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .page-wrapper {
    min-height: 100vh;
    padding-bottom: 60px;
  }

  /* Header Styles */
  .org-header {
    background: white;
    border-bottom: 1px solid #eee;
    padding: 50px 20px;
    display: flex;
    justify-content: center;
  }

  .header-content {
    display: flex;
    align-items: flex-start;
    gap: 40px;
    max-width: 1000px;
    width: 100%;
  }

  .org-logo {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #f9f9f9;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.178);
  }

  .header-text {
    flex: 1;
  }

  .header-text h1 {
    margin: 0;
    color: #1b065e;
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1.2;
    font-family: "Gill-Bold";
  }

  .stats-row {
    margin: 10px 0 20px;
    color: #666;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dot {
    color: #ccc;
  }

  .desc {
    color: #555;
    line-height: 1.6;
    font-size: 1rem;
    max-width: 700px;
    margin-bottom: 25px;
  }

  /* Follow Button */
  .follow-btn {
    padding: 12px 30px;
    border-radius: 25px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    border: 2px solid #1b065e;
    background: transparent;
    color: #1b065e;
    transition: 0.2s all;
  }

  .follow-btn.active {
    background: #1b065e;
    color: white;
  }

  .follow-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(27, 6, 94, 0.2);
  }

  .follow-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Content Area */
  .content-container {
    max-width: 1000px;
    margin: 40px auto;
    padding: 0 20px;
  }

  h2 {
    color: #1b065e;
    margin-bottom: 25px;
    border-bottom: 2px solid #eee;
    padding-bottom: 15px;
    font-size: 1.8rem;
    font-family: "Gill-Bold";
  }

  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 30px;
  }

  .empty-state {
    text-align: center;
    color: #888;
    padding: 60px;
    background: white;
    border-radius: 15px;
    border: 1px dashed #ddd;
  }

  .loading {
    text-align: center;
    padding: 50px;
    color: #666;
    font-size: 1.2rem;
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .desc {
      margin: 0 auto 25px;
    }
    .stats-row {
      justify-content: center;
    }
  }
</style>
