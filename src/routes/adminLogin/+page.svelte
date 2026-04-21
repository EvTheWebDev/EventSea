<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { 
    auth, 
    logIn, 
    signUp, 
    createOrganization, 
    checkUserAdminStatus, 
    getOrgsByIds 
  } from "../../lib/firebase"; 
  
  import "./adminLogin.css";

  // --- STATE ---
  let loading = true;
  let view = "auth"; 
  let creating = false; 
  
  // Login Form Data
  let loginEmail = "";
  let loginPassword = "";

  // Create Org Form Data
  let newOrgName = "";
  let newOrgEmail = ""; 
  let newOrgPassword = ""; // Only used if creating an account from scratch

  // Org Selection Data
  let myOrgs = [];

  // --- LIFECYCLE ---
  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (creating) return;

      if (user) {
        // User is logged in, fetch their orgs
        const orgIds = await checkUserAdminStatus(user.uid);

        if (orgIds && orgIds.length > 0) {
          myOrgs = await getOrgsByIds(orgIds);
        } else {
          myOrgs = []; // Logged in, but no orgs yet
        }
        
        // Always show the dashboard view when logged in
        view = "select";
        loading = false;
      } else {
        view = "auth";
        loading = false;
      }
    });
    return unsubscribe;
  });

  // --- HANDLERS ---

  async function handleLogin() {
    try {
      await logIn(loginEmail, loginPassword);
      // onAuthStateChanged handles the view switch
    } catch (err) {
      alert("Login Failed: " + err.message);
    }
  }

  async function finalizeOrgCreation(uid) {
    try {
      const newOrgId = await createOrganization(uid, newOrgName, newOrgEmail);
      goto(`/adminHome?orgId=${newOrgId}`);
    } catch (err) {
      alert("Failed to create organization: " + err.message);
      creating = false;
    }
  }

  async function handleCreate() {
    creating = true; 

    // SCENARIO A: User is ALREADY logged in
    if (auth.currentUser) {
       await finalizeOrgCreation(auth.currentUser.uid);
       return;
    }

    // SCENARIO B & C: User is NOT logged in
    try {
      const userCredential = await signUp(newOrgEmail, newOrgPassword, "Admin", "User");
      await finalizeOrgCreation(userCredential.user.uid);

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log("User exists, attempting to log in and append Org...");
        try {
          const userCredential = await logIn(newOrgEmail, newOrgPassword);
          await finalizeOrgCreation(userCredential.user.uid);
        } catch (loginErr) {
          alert("An account with this email exists, but the password was incorrect.");
          creating = false;
        }
      } else {
        alert("Creation Failed: " + err.message);
        creating = false;
      }
    }
  }

  function handleSelectOrg(orgId) {
    goto(`/adminHome?orgId=${orgId}`);
  }
</script>

<div class="adminLoginPage">
  
  {#if loading}
    <div class="loginFormHolder">
        <h1 style="color:white;">Loading...</h1>
    </div>

  {:else if view === 'select'}
    <div class="loginFormHolder">
        <div class="logoHolder">
            <h1>Admin Dashboard</h1>
        </div>
        
        <div class="forms">
            <div class="loginForm">
                <h2>Your Organizations</h2>
                
                {#if myOrgs.length > 0}
                    <div class="org-list">
                        {#each myOrgs as org}
    <div class="org-item" on:click={() => handleSelectOrg(org.id)}>
        
        <div class="org-item-left">
            <img src={org.image || "/blankUser.png"} alt="Logo" class="org-list-avatar" />
            
            <h3>
                {(org.orgName || org.name || "Unnamed Org").length > 15 
                    ? (org.orgName || org.name || "Unnamed Org").slice(0, 15) + '...' 
                    : (org.orgName || org.name || "Unnamed Org")}
            </h3>
        </div>

        <span class="arrow">→</span>
    </div>
{/each}
                    </div>
                {:else}
                    <p style="margin-bottom: 20px;">You don't manage any organizations yet.</p>
                {/if}
                
                <!-- <button style="margin-top: 10px; background-color: #666;" on:click={() => auth.signOut()}>Log Out</button> -->
            </div>

            <h3 class="middleOr">OR</h3>

            <div class="createOrgForm">
                <h2>Create New Organization</h2>
                <form class="adminForm" on:submit|preventDefault={handleCreate}>
                    
                    <label for="orgName">Organization Name</label>
                    <input type="text" name="orgName" id="orgName" bind:value={newOrgName} required/>

                    <label for="newOrgEmail">Contact Email</label>
                    <input type="email" name="newOrgEmail" id="newOrgEmail" bind:value={newOrgEmail} required/>

                    <button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create Organization"}
                    </button>
                </form>
            </div>
        </div>
    </div>

  {:else}
  {/if}
</div>