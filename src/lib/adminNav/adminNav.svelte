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
    orgName: "Loading...", 
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
          <img src={safeOrg.image} alt={safeOrg.orgName} width="80" height="80" />
      {/if}
      <p>{safeOrg.orgName}</p>
    </div>
    <p>Org Since: {safeOrg.foundedYear}</p>
    <p>Members: {safeOrg.followers}</p>
  </section>

  <section class="buttons">
    <ul>
      <li>
       
        <a href="/adminHome?orgId={currentId}"> <Icon icon="fa7-solid:house-chimney" width="30" height="30" />
          Home</a>
      </li>
      <li>
       
        <a href="/adminEventCalendar?orgId={currentId}"> <Icon icon="mdi:calendar" width="30" height="30" />
          Event Calendar</a>
      </li>
      <li>
       
        <a href="/adminNewEvent?orgId={currentId}"> <Icon icon="mdi:event-add" width="30" height="30" />
          New Event</a>
      </li>
      <li>
       
        <a href="/adminNewAnnouncement?orgId={currentId}"> <Icon icon="streamline:announcement-megaphone-remix" width="30" height="30" />
          New Announcement</a>
      </li>
      <li>
        
        <a href="/adminMemberList?orgId={currentId}"><Icon icon="majesticons:users-line" width="30" height="30" />
          Member List</a>
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