<script>
  import "../../global.css";
  import "./events.css";
  import Icon from "@iconify/svelte";
  import { onMount, onDestroy } from "svelte";
  import EventCard from "$lib/eventCard/eventCard.svelte";
  import { fetchEvents } from "$lib/firebase";
  import { findBestSearchMatch } from "$lib/search";
  import SearchNotFoundModal from "$lib/searchNotFoundModal.svelte";

  /** @type {Array<Record<string, any>>} */
  let events = [];
  /** @type {Array<Record<string, any>> | null} */
  let filteredEvents = null;
  let loading = true;
  let searchInput = "";
  let searching = false;
  let searchExpanded = false;
  let showNotFoundModal = false;
  let notFoundMessage = "";

  onMount(async () => {
    try {
      events = await fetchEvents({ mode: "all" });
    } catch (err) {
      console.error("Failed to load events:", err);
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
      const result = await findBestSearchMatch(input, { scope: "events" });

      if (result.found && result.id) {
        // Filter the events list to show only the matching event
        const match = events.find((e) => e.id === result.id);
        if (match) {
          filteredEvents = [match];
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
    filteredEvents = null;
    searchInput = "";
  }

  /** @param {MouseEvent} event */
  function toggleSearchBar(event) {
    event.stopPropagation();
    searchExpanded = !searchExpanded;
    if (searchExpanded) {
      setTimeout(() => {
        const input = document.getElementById("events-search");
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

<main class="eventsPage">
  <div class="nav"></div>
  <div class="eventsHero">
    <div class="eventsText">
      <h2>Your adventure starts here.</h2>
      <h1>Upcoming Events</h1>
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
              id="events-search"
              type="search"
              placeholder="Search events by title or organization"
              bind:value={searchInput}
            />
            <button
              type="submit"
              class="searchIconButton"
              aria-label="Search events"
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
        <div class="status">No upcoming events found.</div>
      {/if}
    </div>
  </div>

  <SearchNotFoundModal
    open={showNotFoundModal}
    message={notFoundMessage}
    onClose={closeNotFoundModal}
  />
</main>
