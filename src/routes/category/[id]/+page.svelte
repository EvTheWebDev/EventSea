<script>
  import "../../../global.css";
  import "../category.css";
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import Icon from "@iconify/svelte";
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import { fetchEvents } from "$lib/firebase";

  /** @type {Array<Record<string, any>>} */
  let events = [];
  /** @type {Array<Record<string, any>> | null} */
  let filteredEvents = null;
  let loading = true;
  let searchInput = "";
  let searchExpanded = false;
  let activeSlug = "";

  /** @param {string} slug */
  function toCategoryTitle(slug) {
    return String(slug || "")
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  /**
   * @param {Record<string, any>} eventData
   * @param {string} term
   */
  function matchesSearch(eventData, term) {
    const haystack = [
      eventData.TITLE,
      eventData.orgName,
      eventData.LOCATION,
      eventData.DESCRIPTION,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(term);
  }

  /** @param {string} slug */
  async function loadCategoryEvents(slug) {
    if (!slug) return;

    loading = true;
    filteredEvents = null;
    searchInput = "";

    try {
      events = await fetchEvents({ mode: "category", category: slug });
      activeSlug = slug;
    } catch (err) {
      console.error("Failed to load category events:", err);
      events = [];
      activeSlug = slug;
    } finally {
      loading = false;
    }
  }

  function clearSearch() {
    filteredEvents = null;
    searchInput = "";
  }

  /** @param {SubmitEvent} event */
  function submitSearch(event) {
    event.preventDefault();
    const term = searchInput.trim().toLowerCase();

    if (!term) {
      clearSearch();
      return;
    }

    filteredEvents = events.filter((eventData) =>
      matchesSearch(eventData, term),
    );
    searchExpanded = false;
  }

  /** @param {MouseEvent} event */
  function toggleSearchBar(event) {
    event.stopPropagation();
    searchExpanded = !searchExpanded;

    if (searchExpanded) {
      setTimeout(() => {
        const input = document.getElementById("category-search");
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
    const currentSlug = String($page.params.id || "").toLowerCase();
    loadCategoryEvents(currentSlug);

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });

  onDestroy(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  $: currentSlug = String($page.params.id || "").toLowerCase();
  $: categoryTitle = toCategoryTitle(currentSlug);
  $: if (currentSlug && currentSlug !== activeSlug) {
    loadCategoryEvents(currentSlug);
  }
</script>

<main class="categoryPage">
  <div class="nav"></div>
  <div class="categoryHero">
    <div class="categoryText">
      <h2>Find the best fit for you.</h2>
      <h1>{categoryTitle || "Category"} Events</h1>
    </div>
  </div>

  <div class="eventsContainer">
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
              id="category-search"
              type="search"
              placeholder={`Search in ${categoryTitle || "this category"}`}
              bind:value={searchInput}
            />
            <button
              type="submit"
              class="searchIconButton"
              aria-label="Search category events"
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

    <div class="eventCards">
      {#if loading}
        <div class="status">Loading events...</div>
      {:else if (filteredEvents || events).length > 0}
        <div>
          {#if filteredEvents}
            <button class="clearSearchButton" onclick={clearSearch}
              >Clear Search</button
            >
          {/if}

          <div class="events-grid">
            {#each filteredEvents || events as event}
              <EventCard {event} />
            {/each}
          </div>
        </div>
      {:else}
        <div class="status">No {categoryTitle || "category"} events found.</div>
      {/if}
    </div>
  </div>
</main>
