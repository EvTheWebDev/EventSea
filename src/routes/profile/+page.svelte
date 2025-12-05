<script>
  import "../../global.css";
  import Icon from "@iconify/svelte";
  import { authStore } from "../../store/auth.js";
  import { showMessage } from "../../store/message.js";
  import {
    uploadProfilePicture,
    getProfilePicture,
    changeUserEmail,
    getUserProfile,
    changeUserProfile,
    logOut,
  } from "../../lib/firebase.js";
  import "./profile.css";

  /** @type {{ user: import("firebase/auth").User | null, loading: boolean }} */
  let authStoreValue;
  authStore.subscribe((val) => (authStoreValue = val));

  let firstName = "USER";
  let lastName = "";
  // profile values read from Firestore (preferred)
  /** @type {string | null} */
  let userDocFirst = null;
  /** @type {string | null} */
  let userDocLast = null;
  let email = "";
  /** @type {string | null} */
  let profilePictureUrl = null;
  let uploading = false;
  let uploadError = "";
  let editMode = false;
  let editedEmail = "";
  let saveError = "";
  let editedFirst = "";
  let editedLast = "";

  // derive first/last name preferring Firestore user doc, falling back to auth.displayName
  $: {
    if (userDocFirst !== null || userDocLast !== null) {
      firstName = userDocFirst || "USER";
      lastName = userDocLast || "";
    } else if ($authStore?.user?.displayName) {
      const parts = String($authStore.user.displayName).split(" ");
      firstName = parts[0] || "USER";
      lastName = parts.slice(1).join(" ") || "";
    } else {
      firstName = "USER";
      lastName = "";
    }
  }

  $: email = $authStore?.user?.email || "";

  $: if ($authStore?.user?.uid) {
    loadProfilePicture();
    loadUserProfile();
    editedEmail = $authStore?.user?.email || "";
  }

  async function loadProfilePicture() {
    if (!$authStore?.user?.uid) return;
    try {
      const url = await getProfilePicture(
        /** @type {string} */ ($authStore.user.uid)
      );
      profilePictureUrl = url;
    } catch (err) {
      profilePictureUrl = null;
    }
  }

  async function loadUserProfile() {
    if (!$authStore?.user?.uid) return;
    try {
      /** @type {{ firstName?: string, lastName?: string } | null} */
      const data = await getUserProfile(
        /** @type {string} */ ($authStore.user.uid)
      );
      userDocFirst =
        data && typeof data.firstName === "string" ? data.firstName : null;
      userDocLast =
        data && typeof data.lastName === "string" ? data.lastName : null;
      // initialize edited fields from doc or auth
      editedFirst =
        userDocFirst ??
        ($authStore?.user?.displayName
          ? String($authStore.user.displayName).split(" ")[0]
          : "");
      editedLast =
        userDocLast ??
        ($authStore?.user?.displayName
          ? String($authStore.user.displayName).split(" ").slice(1).join(" ")
          : "");
    } catch (err) {
      userDocFirst = null;
      userDocLast = null;
    }
  }

  /** @param {Event} event */
  async function handlePictureUpload(event) {
    const target = /** @type {HTMLInputElement} */ (event.target);
    const file = target?.files?.[0];
    if (!file || !$authStore?.user?.uid) return;

    uploading = true;
    uploadError = "";
    try {
      const url = await uploadProfilePicture(
        /** @type {string} */ ($authStore.user.uid),
        file
      );
      profilePictureUrl = url;
      // refresh the page so other UI (nav avatar, etc.) updates immediately
      if (typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 150);
      }
    } catch (err) {
      uploadError = String(err) || "Failed to upload picture";
    } finally {
      uploading = false;
    }
  }

  async function saveProfile() {
    saveError = "";
    try {
      // update name fields if changed
      if (
        $authStore?.user &&
        (editedFirst !== userDocFirst || editedLast !== userDocLast)
      ) {
        await changeUserProfile(
          /** @type {string} */ ($authStore.user.uid),
          editedFirst,
          editedLast
        );
      }

      if (
        $authStore?.user &&
        editedEmail &&
        editedEmail !== $authStore.user.email
      ) {
        await changeUserEmail(editedEmail);
      }
      editMode = false;
      // reload to ensure updated profile and avatar are shown across the app
      if (typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 150);
      }
    } catch (err) {
      const e = /** @type {any} */ (err);
      saveError = e?.message || String(e) || "Failed to save profile";
    }
  }

  function cancelEdit() {
    editedEmail = $authStore?.user?.email || "";
    editedFirst =
      userDocFirst ??
      ($authStore?.user?.displayName
        ? String($authStore.user.displayName).split(" ")[0]
        : "");
    editedLast =
      userDocLast ??
      ($authStore?.user?.displayName
        ? String($authStore.user.displayName).split(" ").slice(1).join(" ")
        : "");
    saveError = "";
    editMode = false;
  }

  async function handleSignOut() {
    try {
      await logOut();
      // Store message to display after redirect
      if (
        typeof window !== "undefined" &&
        typeof sessionStorage !== "undefined"
      ) {
        sessionStorage.setItem(
          "pendingMessage",
          JSON.stringify({
            message: "You have successfully signed out!",
            type: "success",
          })
        );
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  }
</script>

<main>
  <div class="nav"></div>
  <h1 id="profHead" class="heading">Hey there, {firstName}!</h1>
  <div class="profileContainer">
    <div class="profile-container">
      <div class="profile-picture-section">
        {#if profilePictureUrl}
          <img src={profilePictureUrl} alt="Profile" class="profile-picture" />
        {:else}
          <div class="profile-picture-placeholder">No Picture</div>
        {/if}

        {#if editMode}
          <label class="upload-label">
            <input
              type="file"
              accept="image/*"
              on:change={handlePictureUpload}
              disabled={uploading}
              style="display: none;"
            />
            <span class="upload-button"
              >{uploading ? "Uploading..." : "Change Picture"}</span
            >
          </label>
        {/if}

        {#if uploadError}
          <p class="error-text">{uploadError}</p>
        {/if}
      </div>

      <div class="profile-info">
        <p class="profileName">
          {#if editMode}
            <input
              type="text"
              class="name-input"
              bind:value={editedFirst}
              placeholder="First name"
            />
            <input
              type="text"
              class="name-input"
              bind:value={editedLast}
              placeholder="Last name"
            />
          {:else}
            {firstName}
            {#if lastName}
              {lastName}{/if}
          {/if}
        </p>

        <p class="profileEmail">
          <Icon
            icon="mdi:email-outline"
            width="15"
            height="15"
            style="color: #0f0446"
          />
          {#if editMode}
            <input type="email" bind:value={editedEmail} />
          {:else}
            {email}
          {/if}
        </p>

        <div class="profile-actions">
          {#if editMode}
            <button on:click={saveProfile} class="save-button">Save</button>
            <button on:click={cancelEdit} class="cancel-button">Cancel</button>
            {#if saveError}
              <div class="error-text">{saveError}</div>
            {/if}
          {:else}
            <button on:click={() => (editMode = true)} class="edit-button"
              ><Icon
                icon="mingcute:pencil-fill"
                width="32"
                height="32"
                style="color: #0f0446"
              /></button
            >
          {/if}
        </div>
      </div>
    </div>
    <div class="profileOrgs">
      <h2>Organization Affiliations</h2>
      <p>You are not part of any organizations yet.</p>
      <a href="../userOrganizations">My Organizations</a>
    </div>
  </div>

  <div class="sign-out-section">
    <button on:click={handleSignOut} class="sign-out-button">Sign Out</button>
  </div>
</main>
