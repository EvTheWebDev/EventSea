<script>
  import "./footer.css";
  import { authStore } from "../../store/auth.js";
  import { showAuthModal, authRedirect } from "../../store/authModal.js"; // Import authRedirect
  import { goto } from "$app/navigation";

  function handleAdminClick(e) {
    e.preventDefault();

    if (!$authStore.user) {
      // Set the redirect path, THEN open the modal
      $authRedirect = "/adminLogin"; 
      $showAuthModal = true;
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