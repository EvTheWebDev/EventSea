<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  
  import "./adminOrgSettings.css";
  
  // Firebase Imports
  import { db, uploadOrgPicture } from "../../lib/firebase"; // Adjust path to firebase.js
  import { 
    doc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    arrayUnion 
  } from "firebase/firestore";

  // State
  let orgId = "";
  let loading = true;
  let editMode = false;
  let uploading = false;

  // Org Data
  let orgName = "";
  let orgEmail = ""; // Read-only usually, but good to show
  let orgImage = "/blankUser.png"; // Default placeholder
  let adminList = []; // Array of UIDs or User Objects if you fetch them

  // Editing State
  let editedName = "";
  let newAdminEmail = "";
  let errorMsg = "";
  let successMsg = "";

  onMount(async () => {
    // 1. Get Org ID from URL
    orgId = $page.url.searchParams.get("orgId");
    
    if (!orgId) {
      goto("/adminLogin");
      return;
    }

    await loadOrgData();
  });

  async function loadOrgData() {
    try {
      loading = true;
      const docRef = doc(db, "orgs", orgId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        orgName = data.orgName;
        orgEmail = data.email;
        orgImage = data.image;
        adminList = data.adminUids || [data.adminUid]; // Handle array or single string legacy
        
        // Init edit values
        editedName = orgName;
      } else {
        errorMsg = "Organization not found.";
      }
    } catch (err) {
      console.error(err);
      errorMsg = "Failed to load organization data.";
    } finally {
      loading = false;
    }
  }

  // --- HANDLERS ---

  async function handlePictureUpload(event) {
    const target = event.target;
    const file = target?.files?.[0];
    if (!file || !orgId) return;

    uploading = true;
    errorMsg = "";
    try {
      // Use the Org specific upload function
      const url = await uploadOrgPicture(orgId, file);
      orgImage = url;
      successMsg = "Logo updated successfully!";
    } catch (err) {
      errorMsg = "Failed to upload picture.";
      console.error(err);
    } finally {
      uploading = false;
    }
  }

  async function saveProfile() {
    errorMsg = "";
    successMsg = "";
    
    try {
      if (editedName !== orgName) {
        const orgRef = doc(db, "orgs", orgId);
        await updateDoc(orgRef, {
            orgName: editedName
        });
        orgName = editedName;
        successMsg = "Organization profile updated!";
        window.location.reload();
      }
      editMode = false;
    } catch (err) {
        errorMsg = "Failed to save changes.";
        console.error(err);
    }
  }

  async function handleAddAdmin() {
    if (!newAdminEmail) return;
    errorMsg = "";
    successMsg = "";

    try {
        // 1. Find the user by email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", newAdminEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            errorMsg = "User not found. They must have an account first.";
            return;
        }

        let foundUserDoc = querySnapshot.docs[0];
        let foundUid = foundUserDoc.id;

        // 2. Update the USER document (Give them the key)
        const userRef = doc(db, "users", foundUid);
        await updateDoc(userRef, {
            managedOrgIDs: arrayUnion(orgId), // Add this org to their list
            isOrgAdmin: true
        });

        // 3. Update the ORG document (Keep a record of them)
        const orgRef = doc(db, "orgs", orgId);
        await updateDoc(orgRef, {
            adminUids: arrayUnion(foundUid)
        });

        successMsg = `Added ${newAdminEmail} as an admin!`;
        newAdminEmail = ""; // Clear input
        
        // Refresh local list (optional, simple push for UI)
        adminList = [...adminList, foundUid];

    } catch (err) {
        console.error(err);
        errorMsg = "Error adding admin.";
    }
  }

  function cancelEdit() {
    editedName = orgName;
    editMode = false;
    errorMsg = "";
  }

  function goBack() {
    goto(`/adminHome?orgId=${orgId}`);
  }
</script>

<main>
  <div class="nav-placeholder">
    <button class="back-btn" on:click={goBack}>← Back to Dashboard</button>
  </div>

  <h1 id="profHead" class="heading">Settings: {orgName}</h1>

  {#if loading}
    <p style="text-align:center;">Loading settings...</p>
  {:else}
    <div class="profileContainer">
      
      <div class="profile-container">
        
        <div class="profile-picture-section">
          {#if orgImage}
            <img src={orgImage} alt="Org Logo" class="profile-picture" />
          {:else}
            <div class="profile-picture-placeholder">No Logo</div>
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
              <span class="upload-button">
                {uploading ? "Uploading..." : "Change Logo"}
              </span>
            </label>
          {/if}
        </div>

        <div class="profile-info">
          
          <div class="profileName">
            {#if editMode}
              <input
                type="text"
                class="name-input"
                bind:value={editedName}
                placeholder="Organization Name"
              />
            {:else}
              {orgName}
            {/if}
          </div>

          <p class="profileEmail">
            <Icon icon="mdi:email-outline" width="15" height="15" style="color: #0f0446" />
            {orgEmail}
          </p>

          <div class="profile-actions">
            {#if editMode}
              <button on:click={saveProfile} class="save-button">Save</button>
              <button on:click={cancelEdit} class="cancel-button">Cancel</button>
            {:else}
              <button on:click={() => (editMode = true)} class="edit-button">
                <Icon icon="mingcute:pencil-fill" width="32" height="32" style="color: #0f0446" />
              </button>
            {/if}
          </div>

          {#if errorMsg}
            <p class="error-text">{errorMsg}</p>
          {/if}
          {#if successMsg}
            <p class="success-text">{successMsg}</p>
          {/if}

        </div>
      </div>

      <div class="manageAdmins" style="margin-top: 30px;">
        <h2>Manage Admins</h2>
        <p class="subtitle">Grant other users access to manage this organization.</p>
        
        <div class="add-admin-form">
            <input 
                type="email" 
                bind:value={newAdminEmail} 
                placeholder="Enter user email (e.g. user@gmail.com)"
                class="name-input"
                style="margin-bottom: 0; width: 70%;"
            />
            <button class="save-btn" on:click={handleAddAdmin}>Add Admin</button>
        </div>

        <div class="admin-list">
            <h3>Current Admin IDs:</h3>
            <ul>
                {#each adminList as adminUid}
                    <li>{adminUid}</li>
                {/each}
            </ul>
        </div>
      </div>

    </div>
  {/if}
</main>

<style>
    /* Additions specific to this page, reusing profile.css for the rest */
    
    .nav-placeholder {
        padding: 20px;
    }

    .back-btn {
        background: none;
        border: none;
        color: #0f0446;
        cursor: pointer;
        font-weight: bold;
        font-size: 1rem;
    }

    .subtitle {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 15px;
    }

    .add-admin-form {
        display: flex;
        gap: 10px;
        align-items: center;
        background: rgba(255,255,255,0.5);
        padding: 15px;
        border-radius: 10px;
    }

    .admin-list {
        margin-top: 20px;
        text-align: left;
    }

    .admin-list ul {
        list-style: none;
        padding: 0;
    }

    .admin-list li {
        background: white;
        padding: 10px;
        margin-bottom: 5px;
        border-radius: 5px;
        font-family: monospace;
        color: #555;
        border: 1px solid #eee;
    }

    .success-text {
        color: green;
        margin-top: 10px;
        font-weight: bold;
    }
</style>