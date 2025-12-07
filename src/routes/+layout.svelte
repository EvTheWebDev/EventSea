<script>
  import { onMount } from "svelte";
  import { messageStore } from "../store/message.js";
  import { page } from "$app/stores";
  import "../global.css";
  import { Nav, Footer, AdminFooter, AdminNav } from "$lib";

  let { children, data } = $props();

  // 1. CREATE THE ORG DATA VARIABLE
  // We use the data coming from layout.server.js
  let orgData = $derived(data.userOrg || null);

  // Admin / User Footer Toggle Logic
  let isAdminRoute = $derived($page.url.pathname.startsWith("/admin"));
  let isAdminLogin = $derived($page.url.pathname.startsWith("/adminLogin"));

  onMount(() => {
    if (typeof sessionStorage !== "undefined") {
      const pending = sessionStorage.getItem("pendingMessage");
      if (pending) {
        try {
          const msg = JSON.parse(pending);
          messageStore.set(msg);
          setTimeout(() => messageStore.set(null), 3000);
          sessionStorage.removeItem("pendingMessage");
        } catch (err) { console.warn(err); }
      }
    }
  });
</script>

<div class="app-shell" class:admin-layout={isAdminRoute}>
  
  {#if !isAdminRoute}
    <Nav />
  {:else if isAdminLogin}
    {:else}
    {#if orgData}
        <AdminNav org={orgData} />
    {/if}
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
    min-height: 100vh;
  }
  .siteContent {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  main { flex: 1; }

  .app-shell.admin-layout {
    flex-direction: row; 
    margin-bottom: 0;   
  }

  .app-shell.admin-layout {
    flex-direction: row;
}

.app-shell.admin-layout main {
    display: flex;
    flex-direction: column;
}
</style>