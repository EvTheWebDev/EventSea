<script>
  let { children } = $props();
  import "../global.css";
  import { Nav, Footer } from "$lib";
</script>

<!-- 
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head> -->

<Nav />

{@render children()}

<Footer />
