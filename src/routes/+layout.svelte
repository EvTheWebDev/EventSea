<script>
  import { onMount } from "svelte";
  import { messageStore } from "../store/message.js";

  let { children } = $props();
  import "../global.css";
  import { Nav, Footer } from "$lib";

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

<Nav />

{@render children()}

<Footer />
