<script>
  import "../../global.css";
  import Icon from "@iconify/svelte";
  import { authStore } from "../../store/auth.js";
  import { promptLogin } from "../../store/authModal.js";
  import { showMessage } from "../../store/message.js";
  import { invalidateAll } from "$app/navigation";
  import {
    uploadProfilePicture,
    getProfilePicture,
    changeUserEmail,
    getUserProfile,
    changeUserProfile,
    logOut,
    fetchOrgs,
    db // Ensure db is imported for the settings update
  } from "../../lib/firebase.js";
  
  import ImageCropper from "$lib/ImageCropper.svelte"; 
  import "./profile.css";

  // --- 1. STATE VARIABLES (Svelte 5 Runes) ---
  let firstName = $state("USER");
  let lastName = $state("");
  let userDocFirst = $state(null);
  let userDocLast = $state(null);
  let email = $state("");
  let profilePictureUrl = $state(null);
  let uploading = $state(false);
  let uploadError = $state("");
  let editMode = $state(false);
  let editedEmail = $state("");
  let saveError = $state("");
  let editedFirst = $state("");
  let editedLast = $state("");

  let followedOrgs = $state([]);
  let managedOrgIDs = $state([]);
  let loadingOrgs = $state(true);

  let tempImageUrl = $state(null);
  let showCropper = $state(false);

  let notificationSettings = $state({
    eventReminders: { email: true, push: true, inApp: true },
    newEvents: { email: true, push: true, inApp: true },
    newPosts: { email: true, push: true, inApp: true }
  });

  let loginPrompted = false;

  // --- 2. REACTIVE LOGIC (Converted from $: to $effect) ---

  // Auth Guard & Initial Data Fetch
  $effect(() => {
    const user = $authStore?.user;
    const loading = $authStore?.loading;

    if (!loading && !user && !loginPrompted) {
      loginPrompted = true;
      promptLogin("/profile");
    }

    if (user?.uid) {
      loadProfilePicture();
      loadUserProfile();
      loadFollowedOrgs(user.uid);
      email = user.email || "";
      if (!editMode) editedEmail = user.email || "";
    }
  });

  // Name Parsing Logic
  $effect(() => {
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
  });

  // --- 3. FUNCTIONS ---

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
      const url = await getProfilePicture($authStore.user.uid);
      profilePictureUrl = url;
    } catch (err) {
      profilePictureUrl = null;
    }
  }

  async function loadUserProfile() {
    if (!$authStore?.user?.uid) return;
    try {
      const data = await getUserProfile($authStore.user.uid);
      
      userDocFirst = data?.firstName || null;
      userDocLast = data?.lastName || null;
      managedOrgIDs = data?.managedOrgIDs || [];

      if (data?.notificationSettings) {
        notificationSettings = data.notificationSettings;
      }

      editedFirst = userDocFirst ?? ($authStore?.user?.displayName ? String($authStore.user.displayName).split(" ")[0] : "");
      editedLast = userDocLast ?? ($authStore?.user?.displayName ? String($authStore.user.displayName).split(" ").slice(1).join(" ") : "");
      
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }

  async function updateSetting(category, method) {
    if (!$authStore?.user?.uid) return;
    
    // Toggle local state for instant UI feedback
    notificationSettings[category][method] = !notificationSettings[category][method];

    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const userRef = doc(db, "users", $authStore.user.uid);
      
      await updateDoc(userRef, {
        notificationSettings: notificationSettings
      });
      showMessage("Preferences updated!", "success");
    } catch (err) {
      console.error("Failed to update preferences:", err);
      // Revert local state on failure
      notificationSettings[category][method] = !notificationSettings[category][method];
      showMessage("Failed to save settings.", "error");
    }
  }

  function handleFileSelect(event) {
    const file = event.target?.files?.[0];
    if (!file) return;

    tempImageUrl = URL.createObjectURL(file);
    showCropper = true;
    event.target.value = ""; 
  }

  async function handleCropSave(blob) {
    if (!$authStore?.user?.uid) return;
    
    showCropper = false;
    uploading = true;
    uploadError = "";

    try {
      const croppedFile = new File([blob], "profile.jpg", { type: "image/jpeg" });
      const url = await uploadProfilePicture($authStore.user.uid, croppedFile);
      profilePictureUrl = url;
      showMessage("Profile picture updated!", "success");
    } catch (err) {
      uploadError = "Failed to upload picture.";
      console.error(err);
    } finally {
      uploading = false;
    }
  }

  async function saveProfile() {
    saveError = "";
    if (!$authStore?.user) return;

    try {
      if (editedFirst !== userDocFirst || editedLast !== userDocLast) {
        await changeUserProfile($authStore.user.uid, editedFirst, editedLast);
      }
      
      if (editedEmail && editedEmail !== $authStore.user.email) {
        await changeUserEmail(editedEmail);
      }
      
      editMode = false;
      showMessage("Profile saved!", "success");
      await invalidateAll();
      window.location.reload();
      // Update local values without a full reload for better UX
      userDocFirst = editedFirst;
      userDocLast = editedLast;
    } catch (err) {
      saveError = err?.message || "Failed to save profile";
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
      window.location.href = "/";
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
              onchange={handleFileSelect} 
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
            <button onclick={saveProfile} class="save-button">Save</button>
            <button onclick={cancelEdit} class="cancel-button">Cancel</button>
            {#if saveError}
              <div class="error-text">{saveError}</div>
            {/if}
          {:else}
            <button onclick={() => (editMode = true)} class="edit-button">
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

  <div class="profileSection notification-settings">
  <h2>Notification Preferences</h2>
  <p class="subtitle">Choose how you'd like to be reached for site updates.</p>

  <div class="settings-table">
    <div class="table-header">
      <span>Alert Type</span>
      <span>In-App</span>
      <span>Email</span>
      <span>Push</span>
    </div>

    <div class="setting-row">
      <span class="category-name">30m Event Reminders</span>
      <button 
        class="toggle-btn {notificationSettings.eventReminders.inApp ? 'on' : 'off'}"
        onclick={() => updateSetting('eventReminders', 'inApp')}
      >
        <Icon icon={notificationSettings.eventReminders.inApp ? "mdi:check-circle" : "mdi:circle-outline"} width="24" />
      </button>
      <button 
        class="toggle-btn {notificationSettings.eventReminders.email ? 'on' : 'off'}"
        onclick={() => updateSetting('eventReminders', 'email')}
      >
        <Icon icon={notificationSettings.eventReminders.email ? "mdi:check-circle" : "mdi:circle-outline"} width="24" />
      </button>
      <button 
        class="toggle-btn {notificationSettings.eventReminders.push ? 'on' : 'off'}"
        onclick={() => updateSetting('eventReminders', 'push')}
      >
        <Icon icon={notificationSettings.eventReminders.push ? "mdi:check-circle" : "mdi:circle-outline"} width="24" />
      </button>
    </div>

    <div class="setting-row">
      <span class="category-name">New Events from Orgs</span>
      <button 
        class="toggle-btn {notificationSettings.newEvents.inApp ? 'on' : 'off'}"
        onclick={() => updateSetting('newEvents', 'inApp')}
      >
        <Icon icon={notificationSettings.newEvents.inApp ? "mdi:check-circle" : "mdi:circle-outline"} width="24" />
      </button>
      <button 
        class="toggle-btn {notificationSettings.newEvents.email ? 'on' : 'off'}"
        onclick={() => updateSetting('newEvents', 'email')}
      >
        <Icon icon={notificationSettings.newEvents.email ? "mdi:check-circle" : "mdi:circle-outline"} width="24" />
      </button>
      <button 
        class="toggle-btn {notificationSettings.newEvents.push ? 'on' : 'off'}"
        onclick={() => updateSetting('newEvents', 'push')}
      >
        <Icon icon={notificationSettings.newEvents.push ? "mdi:check-circle" : "mdi:circle-outline"} width="24" />
      </button>
    </div>

    <div class="setting-row">
      <span class="category-name">New Posts from Orgs</span>
      <button 
        class="toggle-btn {notificationSettings.newPosts.inApp ? 'on' : 'off'}"
        onclick={() => updateSetting('newPosts', 'inApp')}
      >
        <Icon icon={notificationSettings.newPosts.inApp ? "mdi:check-circle" : "mdi:circle-outline"} width="24" />
      </button>
      <button 
        class="toggle-btn {notificationSettings.newPosts.email ? 'on' : 'off'}"
        onclick={() => updateSetting('newPosts', 'email')}
      >
        <Icon icon={notificationSettings.newPosts.email ? "mdi:check-circle" : "mdi:circle-outline"} width="24" />
      </button>
      <button 
        class="toggle-btn {notificationSettings.newPosts.push ? 'on' : 'off'}"
        onclick={() => updateSetting('newPosts', 'push')}
      >
        <Icon icon={notificationSettings.newPosts.push ? "mdi:check-circle" : "mdi:circle-outline"} width="24" />
      </button>
    </div>
  </div>
</div>

  <div class="sign-out-section">
    <button onclick={handleSignOut} class="sign-out-button">Sign Out</button>
  </div>

  {#if showCropper}
    <ImageCropper 
      imageUrl={tempImageUrl} 
      onSave={handleCropSave} 
      onCancel={() => showCropper = false} 
    />
  {/if}
</main>