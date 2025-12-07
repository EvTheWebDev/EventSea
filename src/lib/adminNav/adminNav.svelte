<script>
  import "./adminNav.css";
  import Icon from '@iconify/svelte';
  import { logOut } from "$lib/firebase"; // Adjust path to firebase.js
  import { goto } from "$app/navigation";

  let { org } = $props();
  
  // 1. SAFELY DERIVE DATA
  // We default to an empty string for ID if it's missing
  let safeOrg = $derived(org || { 
    orgID: "",
    name: "Loading...", 
    followers: 0, 
    image: null, 
    foundedYear: "" 
  });

  // 2. CREATE A VARIABLE FOR THE ID (Makes the HTML cleaner)
  let currentId = $derived(safeOrg.orgID);

  async function handleLogout() {
    try {
        await logOut();
        goto("/adminLogin");
    } catch (err) {
        console.error(err);
    }
  }
</script>

<div class="sidebarNav">
  <section class="orgPfp">
    <div class="infoLine">
      {#if safeOrg.image}
          <img src={safeOrg.image} alt={safeOrg.name} width="80" height="80" />
      {/if}
      <p>{safeOrg.name}</p>
    </div>
    <p>Org Since: {safeOrg.foundedYear}</p>
    <p>Members: {safeOrg.followers}</p>
  </section>

  <section class="buttons">
    <ul>
      <li>
        <Icon icon="fa7-solid:house-chimney" width="30" height="30" />
        <a href="/adminHome?orgId={currentId}">Home</a>
      </li>
      <li>
        <Icon icon="mdi:calendar" width="30" height="30" />
        <a href="/adminEventCalendar?orgId={currentId}">Event Calendar</a>
      </li>
      <li>
        <Icon icon="mdi:event-add" width="30" height="30" />
        <a href="/adminNewEvent?orgId={currentId}">New Event</a>
      </li>
      <li>
        <Icon icon="streamline:announcement-megaphone-remix" width="30" height="30" />
        <a href="/adminNewAnnouncement?orgId={currentId}">New Announcement</a>
      </li>
      <li>
        <Icon icon="majesticons:users-line" width="30" height="30" />
        <a href="/adminMemberList?orgId={currentId}">Member List</a>
      </li>
      <li>
        <Icon icon="solar:settings-outline" width="30" height="30" />
        <a href="/adminOrgSettings?orgId={currentId}">Org Settings</a>
      </li>
      
      <li class="logoutButton" onclick={handleLogout} style="cursor: pointer;">
        <Icon icon="ic:round-exit-to-app" width="30" height="30" />
        <span>Log Out</span>
      </li>
    </ul>
  </section>
</div>