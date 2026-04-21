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
  import { onMount, onDestroy } from "svelte";

  // 1. Import the new functional component
  import Organization from "$lib/organization/organization.svelte";
  import SearchNotFoundModal from "$lib/searchNotFoundModal.svelte";
  import { findBestSearchMatch } from "$lib/search";

  // 2. Firebase Imports
  import { db } from "$lib/firebase";
  import { collection, getDocs, query, orderBy } from "firebase/firestore";

  /** @type {Array<Record<string, any>>} */
  let orgs = [];
  /** @type {Array<Record<string, any>> | null} */
  let filteredOrgs = null;
  let loading = true;
  let searchInput = "";
  let searching = false;
  let searchExpanded = false;
  let showNotFoundModal = false;
  let notFoundMessage = "";

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

  /** @param {SubmitEvent} event */
  async function submitSearch(event) {
    event.preventDefault();

    const input = searchInput.trim();
    if (!input || searching) return;

    searching = true;

    try {
      const result = await findBestSearchMatch(input, { scope: "orgs" });

      if (result.found && result.id) {
        // Filter the orgs list to show only the matching org
        const match = orgs.find((o) => o.id === result.id);
        if (match) {
          filteredOrgs = [match];
          searchExpanded = false;
          searchInput = "";
          return;
        }
      }

      notFoundMessage = `"${input}" not found. Please refine your search and try again.`;
      showNotFoundModal = true;
    } finally {
      searching = false;
    }
  }

  function closeNotFoundModal() {
    showNotFoundModal = false;
  }

  function clearSearch() {
    filteredOrgs = null;
    searchInput = "";
  }

  /** @param {Event} event */
  function toggleSearchBar(event) {
    event.stopPropagation();
    searchExpanded = !searchExpanded;
    if (searchExpanded) {
      setTimeout(() => {
        const input = document.getElementById("org-search");
        if (input) input.focus();
      }, 0);
    }
  }

  /** @param {Event} event */
  function handleClickOutside(event) {
    const filtersContainer = document.querySelector(".filters");
    const target = /** @type {Node | null} */ (event.target);
    if (filtersContainer && target && !filtersContainer.contains(target)) {
      searchExpanded = false;
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });

  onDestroy(() => {
    document.removeEventListener("click", handleClickOutside);
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
    <div class="filters">
      {#if !searchExpanded}
        <button
          class="searchTrigger"
          onclick={toggleSearchBar}
          aria-label="Toggle search"
          aria-expanded={searchExpanded}
        >
          <Icon
            icon="material-symbols:search-rounded"
            width="24"
            height="24"
            style="color: #1b065e"
          />
          <span style="font-family:'Mont-Semi';">Search</span>
        </button>
      {/if}

      {#if searchExpanded}
        <form class="searchForm searchFormExpanded" onsubmit={submitSearch}>
          <div class="searchInputWrap">
            <input
              id="org-search"
              type="search"
              placeholder="Search organizations by name"
              bind:value={searchInput}
            />
            <button
              type="submit"
              class="searchIconButton"
              aria-label="Search organizations"
              disabled={searching}
            >
              <Icon
                icon="material-symbols:search-rounded"
                width="24"
                height="24"
                style="color: currentColor"
              />
            </button>
          </div>
        </form>
      {/if}
    </div>

    <div class="orgCards">
      {#if loading}
        <div class="status">Loading organizations...</div>
      {:else if (filteredOrgs || orgs).length > 0}
        <div>
          {#if filteredOrgs}
            <button
              class="clearSearchButton"
              onclick={clearSearch}
              >Clear Search</button
            >
          {/if}
          <div class="orgs-grid">
            {#each filteredOrgs || orgs as org (org.id)}
              <Organization {org} />
            {/each}
          </div>
        </div>
      {:else}
        <div class="status">No organizations found.</div>
      {/if}
    </div>
  </div>

  <SearchNotFoundModal
    open={showNotFoundModal}
    message={notFoundMessage}
    onClose={closeNotFoundModal}
  />
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
