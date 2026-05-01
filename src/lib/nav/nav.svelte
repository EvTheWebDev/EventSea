<script>
  import "./nav.css";
  import { fade } from "svelte/transition";
  import { showAuthModal, authRedirect, promptLogin } from "../../store/authModal.js";
  import { goto, invalidateAll } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import { authStore } from "../../store/auth.js";
  import { messageStore, showMessage } from "../../store/message.js";
  import { signUp, logIn, getProfilePicture } from "../firebase.js";
  import  NotificationBell  from "../notificationBell/NotificationBell.svelte";

  let authMode = "login";
  let email = "";
  let password = "";
  let firstName = "";
  let lastName = "";
  let error = "";
  /** @type {string | null} */
  let navAvatar = null;

  let isMobileMenuOpen = false;
  // NEW: Track which dropdown is open on mobile
  let activeDropdown = null; 

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
    activeDropdown = null; // Reset dropdowns when closing hamburger
  }

  // NEW: Close everything when navigating
  function closeMobileMenu() {
    isMobileMenuOpen = false;
    activeDropdown = null;
  }

  // NEW: Handle mobile dropdown clicks
  /** @param {Event} e, @param {string} menuName */
  function handleDropdownClick(e, menuName) {
    // Only hijack the click if we are in the mobile menu view
    if (isMobileMenuOpen) {
      e.preventDefault(); // Stop them from navigating to /events
      // Toggle the dropdown (close if already open, open if closed)
      activeDropdown = activeDropdown === menuName ? null : menuName;
    }
  }

  function openAuth(mode = "login") {
    authMode = mode;
    error = "";
    $showAuthModal = true;
    closeMobileMenu();
  }

  async function submitAuth() {
    error = "";
    try {
      if (authMode === "login") {
        await logIn(email, password);
        showMessage("You have successfully logged in!");
      } else {
        await signUp(email, password, firstName, lastName);
        showMessage("You have successfully signed up!");
      }

      // await invalidateAll();
      window.location.reload();

      $showAuthModal = false;
      email = ""; firstName = ""; lastName = ""; password = "";

      if ($authRedirect) {
        goto($authRedirect);
        $authRedirect = null; 
      }
    } catch (err) {
      const e = /** @type {any} */ (err);
      error = e?.message || String(e);
    }
  }

  function closeAuth() {
    $showAuthModal = false;
    $authRedirect = null; 
    error = "";
  }

  /** @param {Event} e */
  function protectClick(e) {
    if (!$authStore.user) {
      e.preventDefault();
      const anchor = /** @type {HTMLAnchorElement | null} */ (e.currentTarget);
      const redirectPath = anchor?.getAttribute("href") || null;
      promptLogin(redirectPath);
      closeMobileMenu();
    }
  }

  $: if ($authStore.user && $showAuthModal) {
    $showAuthModal = false;
    error = ""; email = ""; password = ""; firstName = ""; lastName = "";
  }

  $: if ($authStore?.user?.uid) {
    (async () => {
      try {
        const url = await getProfilePicture(/** @type {string} */ ($authStore.user.uid));
        navAvatar = url;
      } catch (e) {
        navAvatar = null;
      }
    })();
  } else {
    navAvatar = null;
  }
</script>

<nav>
  <a href="/" class="logoLink"><div class="logo">EventSea</div></a>
  
  <div class="mobileButtons">
    {#if $authStore.user}
      <div class="mobileBell">
        <NotificationBell/>
      </div>
    {/if}
 
    <button class="hamburger" on:click={toggleMobileMenu} aria-label="Toggle menu">
      <Icon icon={isMobileMenuOpen ? "material-symbols:close" : "material-symbols:menu"} width="36" height="36" />
    </button>
  </div>
 
  <div class="nav-right">
    <div class="links" class:open={isMobileMenuOpen}>
      <li class="menuItem"><a href="/" on:click={closeMobileMenu}>Home</a></li>
      
      <li class="menuItem" class:open-submenu={activeDropdown === 'events'}>
        <a href="/events" on:click={(e) => handleDropdownClick(e, 'events')}>
          Events
          <Icon icon="icon-park-outline:down" width="18" height="18" style="color: #fff;margin-left:2px" class="dropdown-icon" />
        </a>
        <ul id="menuEvents">
          <li class="subItem"><a href="/userEvents" on:click={(e) => { protectClick(e); closeMobileMenu(); }}>My Events</a></li>
          <li class="subItem"><a href="/events" on:click={closeMobileMenu}>All Events</a></li>
        </ul>
      </li>

      <li class="menuItem" class:open-submenu={activeDropdown === 'orgs'}>
        <a href="/organizations" on:click={(e) => handleDropdownClick(e, 'orgs')}>
          Organizations
          <Icon icon="icon-park-outline:down" width="18" height="18" style="color: #fff;margin-left:2px" class="dropdown-icon" />
        </a>
        <ul id="menuOrg">
          <li><a href="/userOrganizations" on:click={(e) => { protectClick(e); closeMobileMenu(); }}>My Organizations</a></li>
          <li><a href="/organizations" on:click={closeMobileMenu}>All Organizations</a></li>
        </ul>
      </li>

      <li class="menuItem">
        {#if $authStore.user}
          <a href="/profile" class="profile-link" on:click={closeMobileMenu}>
            My Profile
            {#if navAvatar}
              <img src={navAvatar} alt="avatar" class="nav-avatar" />
            {/if}
          </a>
        {:else}
          <button type="button" class="auth-toggle" on:click={() => openAuth("login")}>Log In/Sign Up</button>
        {/if}
      </li>
    </div>

    {#if $authStore.user}
      <div class="desktopBell">
        <NotificationBell />
      </div>
    {/if}
  </div>
</nav>

{#if $showAuthModal}
  <div
    class="auth-modal"
    role="dialog"
    aria-modal="true"
    in:fade={{ duration: 180 }}
    out:fade={{ duration: 160 }}
  >
    <div
      class="auth-panel"
      in:fade={{ duration: 220 }}
      out:fade={{ duration: 180 }}
    >
      <button class="close" on:click={closeAuth} aria-label="Close">×</button>
      <div class="auth-switch">
        <button
          class:active={authMode === "login"}
          on:click={() => (authMode = "login")}>Log In</button>
        <button
          class:active={authMode === "signup"}
          on:click={() => (authMode = "signup")}>Sign Up</button>
      </div>

      <form on:submit|preventDefault={submitAuth} class="auth-form">
        {#if authMode === "signup"}
          <label>
            <span>First name</span>
            <input type="text" bind:value={firstName} required />
          </label>
          <label>
            <span>Last name</span>
            <input type="text" bind:value={lastName} required />
          </label>
        {/if}
        <label>
          <span>Email</span>
          <input type="email" bind:value={email} required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" bind:value={password} required />
        </label>
        {#if error}
          <div class="auth-error">{error}</div>
        {/if}
        <button type="submit" class="submit"
          >{authMode === "login" ? "Log In" : "Sign Up"}</button>
      </form>
    </div>
  </div>
{/if}

{#if $messageStore}
  <div
    class="success-modal-overlay"
    aria-hidden={!$messageStore}
    in:fade={{ duration: 180 }}
    out:fade={{ duration: 160 }}
  >
    <div
      class="success-modal"
      role="alertdialog"
      aria-modal="true"
      in:fade={{ duration: 220 }}
      out:fade={{ duration: 180 }}
      aria-label="Success message"
    >
      <button
        class="success-close"
        on:click={() => messageStore.set(null)}
        aria-label="Close">×</button>
      <div class="success-content">{$messageStore.message}</div>
    </div>
  </div>
{/if}