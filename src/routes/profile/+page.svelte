<script>
  import "../../global.css";
  import Icon from "@iconify/svelte";
  import { authStore } from "../../stores/auth.js";

  let firstName = "USER";

  // derive first name from authStore.user.displayName when available
  $: firstName = $authStore?.user?.displayName
    ? String($authStore.user.displayName).split(" ")[0]
    : "USER";
</script>

<main>
  <div class="nav"></div>
  <h1 class="heading">Hey there, {firstName}!</h1>
</main>
