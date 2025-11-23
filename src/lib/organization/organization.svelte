<script>
  import "./organization.css";
  import Icon from "@iconify/svelte";
  export let logo = "/homeHero.png";
  export let alt = "Alt text for the organization logo.";
  export let name = "Default Organization Name";
  export let members = 0;
  export let description = "Default organization description goes here.";
</script>

<div class="orgCard">
  <div class="flex">
    <img src={logo} {alt} class="orgLogo" />
    <div class="orgInfo">
      <h3>{name}</h3>
      <span
        ><Icon
          icon="ion:people"
          class="margin"
          width="14"
          height="14"
        />{members} members</span
      >
    </div>
  </div>
  <p>{description}</p>
  <div class="orgButtons">
    <button><a href="/singleOrgs">View Organization</a></button>
    <button><a href="/singleEvent">Upcoming Events</a></button>
  </div>
</div>
