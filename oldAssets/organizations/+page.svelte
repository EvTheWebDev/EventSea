<script>
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
</main>
