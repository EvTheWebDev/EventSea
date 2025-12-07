<script>
  import { Event } from "$lib";
  import "../../global.css";
  import "../saved.css";
  import Icon from "@iconify/svelte";
</script>

<main class="savedPage">
  <div class="nav"></div>
  <div class="savedContent">
    <h2 class="heading">Your Saved Events</h2>
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
      <p>You currently have no saved events. Let's go add some!</p>
    </div>
  </div>
</main>
