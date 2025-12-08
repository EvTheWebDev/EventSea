<!-- <script>
  import { Org } from "$lib";

  import Icon from "@iconify/svelte";
</script>

<main class="savedPage">
  <div class="nav"></div>
  <div class="savedContent">
    <h2 class="heading">Your Saved Organizations</h2>
    <div class="filters">
      <div class="search">
        <Icon
          icon="material-symbols:search-rounded"
          width="24"
          height="24"
          style="color: #1b065e;margin-right: 4px"
        />
        Search
      </div>
      <div class="filter">
        <Icon
          icon="mdi:filter-outline"
          width="24"
          height="24"
          style="color: #1b065e;margin-right: 4px"
        />
        Filter
      </div>
      <div class="sort">
        <Icon
          icon="material-symbols:sort-rounded"
          width="24"
          height="24"
          style="color: #1b065e;margin-right: 4px"
        />
        Sort
      </div>
    </div>
    <div class="savedItems">
      <p>You currently are in no organizations. Let's go find some!</p>
    </div>
  </div>
</main> -->

<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  // Import your updated component
  import Organization from "$lib/organization/organization.svelte";
  import { auth, db } from "$lib/firebase";
  import { collection, query, where, getDocs } from "firebase/firestore";
  import "../../global.css";
  import "../saved.css";

  let myOrgs = [];
  let loading = true;

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchMyOrgs(user.uid);
      } else {
        goto("/login");
      }
    });
    return unsubscribe;
  });

  async function fetchMyOrgs(uid) {
    try {
      const orgsRef = collection(db, "orgs");
      // QUERY: Find orgs where 'followers' array contains this UID
      const q = query(orgsRef, where("followers", "array-contains", uid));
      const snapshot = await getDocs(q);

      myOrgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error("Error fetching orgs:", err);
    } finally {
      loading = false;
    }
  }

  // Instant removal from list when unfollowing
  function handleToggle(event) {
    if (event.detail.status === false) {
      myOrgs = myOrgs.filter((o) => o.id !== event.detail.id);
    }
  }
</script>

<div class="nav"></div>
<div class="page-container">
  <h1>My Organizations</h1>
  <p class="subtitle">Organizations you follow.</p>

  {#if loading}
    <div class="status">Loading...</div>
  {:else if myOrgs.length > 0}
    <div class="orgs-grid">
      {#each myOrgs as org (org.id)}
        <Organization {org} on:toggle={handleToggle} />
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <h3>You aren't following any organizations yet.</h3>
      <a href="/events" class="browse-link">Find Events & Orgs →</a>
    </div>
  {/if}
</div>
