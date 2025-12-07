<script>
  import { onMount } from "svelte";
  import { messageStore } from "../store/message.js";
  import { page } from "$app/stores";
  let { children, data } = $props();

  let orgData = $derived(data.userOrg || {});
  import "../global.css";
  import { Nav, Footer, AdminFooter, AdminNav } from "$lib";

  // Admin / User Footer Toggle Logic
  let isAdminRoute = $derived($page.url.pathname.startsWith("/admin"));
  let isAdminLogin = $derived($page.url.pathname.startsWith("/adminLogin"));


  onMount(() => {
    // Check for pending message from sessionStorage (e.g., after redirect)
    if (typeof sessionStorage !== "undefined") {
      const pending = sessionStorage.getItem("pendingMessage");
      if (pending) {
        try {
          const msg = JSON.parse(pending);
          messageStore.set(msg);
          // Auto-dismiss after 3 seconds
          setTimeout(() => messageStore.set(null), 3000);
          // Clear the sessionStorage so it doesn't show again
          sessionStorage.removeItem("pendingMessage");
        } catch (err) {
          console.warn("Failed to parse pending message:", err);
        }
      }
    }
  });
</script>

<!-- 
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head> -->

<div class="app-shell" class:admin-layout={isAdminRoute}>
  
  {#if !isAdminRoute}
    <Nav />
  {:else if isAdminLogin}
    <!-- No Nav for Admin Login -->
  {:else}
    <AdminNav org={orgData} />
  {/if}

  <div class="siteContent">
    <main>
      {@render children()}
    </main>

    {#if !isAdminRoute}
      <Footer />
    {:else}
      <AdminFooter />
    {/if}
  </div>

</div>


<style>
  .app-shell {
    display: flex;
    flex-direction: column; 
    min-height: 100vh; /* CRITICAL: Forces the layout to fill the screen */
  }

  .siteContent {
    display: flex;
    flex-direction: column;
    width: 100%; /* Ensures it takes full width in admin mode */
  }

  main {
    flex: 1; /* Pushes the footer to the bottom of the content area */
  }

  /* --- Admin Styles (Sidebar View) --- */
  .app-shell.admin-layout {
    flex-direction: row; /* Sidebar left, Content right */
    margin-bottom: 0;    /* Remove that negative margin you had */
  }
</style>
