<script>
  import "./nav.css";
  import Icon from "@iconify/svelte";
  import { authStore } from "../../store/auth.js";
  import { signUp, logIn, getProfilePicture } from "../firebase.js";

  let showAuthModal = false;
  let authMode = "login"; // 'login' | 'signup'
  let showWarningBar = false;
  let warningText = "You must be signed in to perform this action!";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let warningTimer;

  let email = "";
  let password = "";
  let firstName = "";
  let lastName = "";
  let error = "";
  /** @type {string | null} */
  let navAvatar = null;

  // Open auth modal and choose mode
  function openAuth(mode = "login") {
    authMode = mode;
    error = "";
    showAuthModal = true;
  }

  async function submitAuth() {
    error = "";
    try {
      if (authMode === "login") {
        await logIn(email, password);
      } else {
        await signUp(email, password, firstName, lastName);
      }
      // firebase auth listener will update the store; close modal
      showAuthModal = false;
      email = "";
      firstName = "";
      lastName = "";
      password = "";
    } catch (err) {
      const e = /** @type {any} */ (err);
      error = e?.message || String(e);
    }
  }

  function closeAuth() {
    showAuthModal = false;
    error = "";
  }

  // Protect certain links when user is signed out
  /** @param {Event} e */
  function protectClick(e) {
    if (!$authStore.user) {
      e.preventDefault();
      showWarningBar = true;
      // clear any previous timer
      if (warningTimer) clearTimeout(/** @type {any} */ (warningTimer));
      warningTimer = /** @type {ReturnType<typeof setTimeout>} */ (
        setTimeout(() => {
          showWarningBar = false;
          warningTimer = undefined;
        }, 3000)
      );
    }
  }

  function closeWarning() {
    if (warningTimer) clearTimeout(/** @type {any} */ (warningTimer));
    warningTimer = undefined;
    showWarningBar = false;
  }

  // Auto-close auth modal when user becomes authenticated
  $: if ($authStore.user && showAuthModal) {
    showAuthModal = false;
    error = "";
    email = "";
    password = "";
    firstName = "";
    lastName = "";
  }

  // Load small avatar for nav when user signs in
  $: if ($authStore?.user?.uid) {
    (async () => {
      try {
        const user = $authStore.user;
        if (!user?.uid) {
          navAvatar = null;
          return;
        }
        const uid = /** @type {string} */ (user.uid);
        const url = await getProfilePicture(uid);
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
  <div class="logo">Logo</div>
  <div class="links">
    <li class="menuItem"><a href="/">Home</a></li>
    <li class="menuItem">
      <a href="/events">
        Events<Icon
          icon="icon-park-outline:down"
          width="18"
          height="18"
          style="color: #fff;margin-left:2px"
        />
      </a>
      <ul id="menuEvents">
        <li class="subItem">
          <a href="/userEvents" on:click={protectClick}>My Events</a>
        </li>
        <li class="subItem"><a href="/">All Events</a></li>
      </ul>
    </li>
    <li class="menuItem">
      <a href="/organizations">
        Organizations<Icon
          icon="icon-park-outline:down"
          width="18"
          height="18"
          style="color: #fff;margin-left:2px"
        />
      </a>
      <ul id="menuOrg">
        <li>
          <a href="/userOrganizations" on:click={protectClick}
            >My Organizations</a
          >
        </li>
        <li>
          <a href="/userAnnouncements" on:click={protectClick}
            >My Announcements</a
          >
        </li>
        <li><a href="/">All Organizations</a></li>
      </ul>
    </li>
    <li class="menuItem">
      {#if $authStore.user}
        <a href="/profile" class="profile-link">
          My Profile
          {#if navAvatar}
            <img src={navAvatar} alt="avatar" class="nav-avatar" />
          {/if}
        </a>
      {:else}
        <button
          type="button"
          class="auth-toggle"
          on:click={() => openAuth("login")}>Log In/Sign Up</button
        >
      {/if}
    </li>
  </div>
</nav>

{#if showWarningBar}
  <div class="warning-modal-overlay" aria-hidden={!showWarningBar}>
    <div
      class="warning-modal"
      role="alertdialog"
      aria-modal="true"
      aria-label="Sign-in required"
    >
      <button class="warning-close" on:click={closeWarning} aria-label="Close"
        >×</button
      >
      <div class="warning-content">{warningText}</div>
    </div>
  </div>
{/if}

{#if showAuthModal}
  <div class="auth-modal" role="dialog" aria-modal="true">
    <div class="auth-panel">
      <button class="close" on:click={closeAuth} aria-label="Close">×</button>
      <div class="auth-switch">
        <button
          class:active={authMode === "login"}
          on:click={() => (authMode = "login")}>Log In</button
        >
        <button
          class:active={authMode === "signup"}
          on:click={() => (authMode = "signup")}>Sign Up</button
        >
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
          >{authMode === "login" ? "Log In" : "Sign Up"}</button
        >
      </form>
    </div>
  </div>
{/if}
