<script>
  import "../../global.css";
  import Icon from "@iconify/svelte";
  import { authStore } from "../../store/auth.js";
  import { promptLogin } from "../../store/authModal.js";
  import { showMessage } from "../../store/message.js";
  import {
    uploadProfilePicture,
    getProfilePicture,
    changeUserEmail,
    getUserProfile,
    changeUserProfile,
    logOut,
    fetchOrgs
  } from "../../lib/firebase.js";
  
  import ImageCropper from "$lib/ImageCropper.svelte"; 
  import "./profile.css";

  /** @type {{ user: import("firebase/auth").User | null, loading: boolean }} */
  let authStoreValue;
  authStore.subscribe((val) => (authStoreValue = val));
  let loginPrompted = false;

  let firstName = "USER";
  let lastName = "";
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

  /** @type {any[]} */
  let followedOrgs = [];
  /** @type {string[]} */
  let managedOrgIDs = [];
  let loadingOrgs = true;

  /** @type {string | null} */
  let tempImageUrl = null;
  let showCropper = false;

  $: if (
    authStoreValue &&
    !authStoreValue.loading &&
    !authStoreValue.user &&
    !loginPrompted
  ) {
    loginPrompted = true;
    promptLogin("/profile");
  }

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
    loadFollowedOrgs($authStore.user.uid);
    editedEmail = $authStore?.user?.email || "";
  }

  /** @param {string} uid */
  async function loadFollowedOrgs(uid) {
    loadingOrgs = true;
    try {
      followedOrgs = await fetchOrgs({ mode: 'myOrgs', userId: uid });
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      loadingOrgs = false;
    }
  }

  async function loadProfilePicture() {
    if (!$authStore?.user?.uid) return;
    try {
      const url = await getProfilePicture(/** @type {string} */ ($authStore.user.uid));
      profilePictureUrl = url;
    } catch (err) {
      profilePictureUrl = null;
    }
  }

  async function loadUserProfile() {
    if (!$authStore?.user?.uid) return;
    try {
      /** @type {{ firstName?: string, lastName?: string, managedOrgIDs?: string[] } | null} */
      const data = await getUserProfile(/** @type {string} */ ($authStore.user.uid));
      
      // FIXED: Removed the duplicate data fetching that was crashing the compiler
      userDocFirst = data && typeof data.firstName === "string" ? data.firstName : null;
      userDocLast = data && typeof data.lastName === "string" ? data.lastName : null;
      managedOrgIDs = data?.managedOrgIDs || [];

      editedFirst = userDocFirst ?? ($authStore?.user?.displayName ? String($authStore.user.displayName).split(" ")[0] : "");
      editedLast = userDocLast ?? ($authStore?.user?.displayName ? String($authStore.user.displayName).split(" ").slice(1).join(" ") : "");
      
    } catch (err) {
      userDocFirst = null;
      userDocLast = null;
      managedOrgIDs = [];
    }
  }

  /** @param {Event} event */
  function handleFileSelect(event) {
    const target = /** @type {HTMLInputElement} */ (event.target);
    const file = target?.files?.[0];
    if (!file) return;

    tempImageUrl = URL.createObjectURL(file);
    showCropper = true;
    target.value = ""; 
  }

  /** @param {Blob} blob */
  async function handleCropSave(blob) {
    if (!$authStore?.user?.uid) return;
    
    showCropper = false;
    uploading = true;
    uploadError = "";

    try {
      const croppedFile = new File([blob], "profile.jpg", { type: "image/jpeg" });
      
      // FIXED: Passed the correct variable name (croppedFile) into the upload function
      const url = await uploadProfilePicture(
        /** @type {string} */ ($authStore.user.uid),
        croppedFile,
      );
      profilePictureUrl = url;
    } catch (err) {
      uploadError = String(err) || "Failed to upload cropped picture";
    } finally {
      uploading = false;
    }
  }

  async function saveProfile() {
    saveError = "";
    try {
      if (
        $authStore?.user &&
        (editedFirst !== userDocFirst || editedLast !== userDocLast)
      ) {
        await changeUserProfile(
          /** @type {string} */ ($authStore.user.uid),
          editedFirst,
          editedLast,
        );
      }
      if ($authStore?.user && editedEmail && editedEmail !== $authStore.user.email) {
        await changeUserEmail(editedEmail);
      }
      editMode = false;
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
    editedFirst = userDocFirst ?? ($authStore?.user?.displayName ? String($authStore.user.displayName).split(" ")[0] : "");
    editedLast = userDocLast ?? ($authStore?.user?.displayName ? String($authStore.user.displayName).split(" ").slice(1).join(" ") : "");
    saveError = "";
    editMode = false;
  }

  async function handleSignOut() {
    try {
      await logOut();
      if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(
          "pendingMessage",
          JSON.stringify({ message: "You have successfully signed out!", type: "success" })
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
    <div class="profile-container profileSection">
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
              accept="image/png, image/jpeg, image/webp"
              on:change={handleFileSelect}
              disabled={uploading}
              style="display: none;"
            />
            <span class="upload-button">{uploading ? "Uploading..." : "Change Picture"}</span>
          </label>
        {/if}

        {#if uploadError}
          <p class="error-text">{uploadError}</p>
        {/if}
      </div>

      <div class="profile-info">
        <p class="profileName">
          {#if editMode}
            <input type="text" class="name-input" bind:value={editedFirst} placeholder="First name" />
            <input type="text" class="name-input" bind:value={editedLast} placeholder="Last name" />
          
          {:else}
            {firstName} {#if lastName}{lastName}{/if}
          {/if}
        </p>
        

        <p class="profileEmail">
          {#if editMode}
            <input type="email" bind:value={editedEmail} />
          {:else}
            <Icon icon="mdi:email-outline" width="15" height="15" style="color: #0f0446" />
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
            <button on:click={() => (editMode = true)} class="edit-button">
              <Icon icon="mingcute:pencil-fill" width="32" height="32" style="color: #0f0446" />
            </button>
          {/if}
        </div>
      </div>
    </div>
    
    <div class="profileOrgs profileSection">
      <h2>Organization Affiliations</h2>

      {#if loadingOrgs}
        <p>Loading your organizations...</p>
      {:else if followedOrgs.length > 0}
        <div class="orgs-grid">
          {#each followedOrgs as org}
            <a href="/organizations/{org.id}" class="profile-org-card" class:admin-card={managedOrgIDs.includes(org.id)}>
              <img src={org.image || "/blankUser.png"} alt="Logo" class="profile-org-avatar" />
              <div class="profile-org-info">
                <h3>{org.orgName || org.name || "Unnamed Org"}</h3>
                {#if managedOrgIDs.includes(org.id)}
                  <span class="admin-badge">Admin</span>
                {/if}
              </div>
            </a>
          {/each}
        </div>
      {:else}
        <p>You are not part of any organizations yet.</p>
      {/if}

      <a href="../userOrganizations" class="view-all-link">My Organizations →</a>
    </div>
  </div>

  <div class="sign-out-section">
    <button on:click={handleSignOut} class="sign-out-button">Sign Out</button>
  </div>

  {#if showCropper}
    <ImageCropper 
      imageUrl={tempImageUrl} 
      onSave={handleCropSave} 
      onCancel={() => showCropper = false} 
    />
  {/if}
</main>