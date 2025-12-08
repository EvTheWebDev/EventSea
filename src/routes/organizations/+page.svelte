<!-- <script>
  import "./orgs.css";
  import { Org } from "$lib";
  import "../../global.css";
  import Icon from "@iconify/svelte";
</script>

<main class="orgPage">
  <div class="nav"></div>
  <div class="orgHero">
    <div class="orgText">
      <h2>Find where you belong.</h2>
      <h1>Student Organizations</h1>
    </div>
  </div>
  <div class="orgContainer">
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
    <div class="orgCards">
      <Org />
      <Org />
      <Org />
      <Org />
      <Org />
      <Org />
    </div>
  </div>
</main> -->

<script>
  import "../../global.css";
  import "./orgs.css";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";

  // 1. Import the new functional component
  import Organization from "$lib/organization/organization.svelte";

  // 2. Firebase Imports
  import { db } from "$lib/firebase";
  import { collection, getDocs, query, orderBy } from "firebase/firestore";

  let orgs = [];
  let loading = true;

  onMount(async () => {
    try {
      const orgsRef = collection(db, "orgs");

      // 3. Query: Get all orgs, sorted A-Z
      const q = query(orgsRef, orderBy("orgName", "asc"));

      const snapshot = await getDocs(q);

      orgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error("Error loading organizations:", err);
    } finally {
      loading = false;
    }
  });
</script>

<main class="orgPage">
  <div class="nav"></div>

  <div class="orgHero">
    <div class="orgText">
      <h2>Find where you belong.</h2>
      <h1>Student Organizations</h1>
    </div>
  </div>

  <div class="orgContainer">
    <!-- <div class="filters">
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
    </div> -->

    <div class="orgCards">
      {#if loading}
        <div class="status">Loading organizations...</div>
      {:else if orgs.length > 0}
        <div class="orgs-grid">
          {#each orgs as org (org.id)}
            <Organization {org} />
          {/each}
        </div>
      {:else}
        <div class="status">No organizations found.</div>
      {/if}
    </div>
  </div>
</main>

<style>
  /* Add grid styling to ensure the cards wrap nicely */
  .orgs-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    justify-content: center;
  }

  .status {
    text-align: center;
    padding: 50px;
    color: #666;
    font-size: 1.2rem;
    width: 100%;
  }
</style>
