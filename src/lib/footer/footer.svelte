<script>
  import "./footer.css";
  import { authStore } from "../../store/auth.js";
  import { promptLogin } from "../../store/authModal.js";
  import { goto } from "$app/navigation";

  function handleAdminClick(e) {
    e.preventDefault();

    if (!$authStore.user) {
      promptLogin("/adminLogin");
    } else {
      goto("/adminLogin");
    }
  }
</script>

<footer class="userFooter">
  <div>
    <a href="/adminLogin" on:click={handleAdminClick}>Admin? Click Here!</a>
    <p>Copyright 2025 All Rights Reserved</p>
  </div>
</footer>
