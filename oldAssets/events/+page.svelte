<script>
  import { Event } from "$lib";
  import "../../global.css";
  import "./events.css";
  import Icon from "@iconify/svelte";
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
    <div class="eventCards">
      <Event />
      <Event />
      <Event />
      <Event />
      <Event />
      <Event />
    </div>
  </div>
</main>
