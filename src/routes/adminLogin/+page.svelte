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
  let creating = false; // To disable button while processing
  
  // Login Form Data
  let loginEmail = "";
  let loginPassword = "";

  // Create Org Form Data
  let newOrgName = "";
  let newOrgEmail = ""; 
  let newOrgPassword = "";

  // Org Selection Data
  let myOrgs = [];

  // --- LIFECYCLE ---
  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // If we are currently running a creation process, don't interrupt with the listener
      if (creating) return;

      if (user) {
        const orgIds = await checkUserAdminStatus(user.uid);

        if (orgIds && orgIds.length > 0) {
          if (orgIds.length === 1) {
            goto(`/adminHome?orgId=${orgIds[0]}`);
          } else {
            myOrgs = await getOrgsByIds(orgIds);
            view = "select";
            loading = false;
          }
        } else {
            // User exists but has no orgs yet
            loading = false; 
        }
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
      // onAuthStateChanged handles the routing
    } catch (err) {
      alert("Login Failed: " + err.message);
    }
  }

  // Helper to run the DB operations after we have a valid User ID
  async function finalizeOrgCreation(uid) {
    // Create the Org and link it to the user
    const newOrgId = await createOrganization(uid, newOrgName, newOrgEmail);
    
    // Redirect immediately
    goto(`/adminHome?orgId=${newOrgId}`);
  }

  async function handleCreate() {
  
    
    creating = true; // Stop the onAuthStateChanged listener from interfering

    try {
      // SCENARIO B: Try to create a NEW account
      const userCredential = await signUp(newOrgEmail, newOrgPassword, "Admin", "User");
      
      // If successful, proceed
      await finalizeOrgCreation(userCredential.user.uid);

    } catch (err) {
      
      // SCENARIO C: User already exists?
      if (err.code === 'auth/email-already-in-use') {
        console.log("User exists, attempting to log in and append Org...");
        
        try {
          // Try to log them in with the password they provided
          const userCredential = await logIn(newOrgEmail, newOrgPassword);
          
          // If password matched, proceed to create org for this EXISTING user
          await finalizeOrgCreation(userCredential.user.uid);

        } catch (loginErr) {
          // User exists, but password was wrong
          alert("An account with this email exists, but the password was incorrect.");
          creating = false;
        }

      } else {
        // Genuine creation error (e.g. weak password)
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
            <h1>Select Organization</h1>
        </div>
        <div class="forms" style="justify-content: center;">
            <div class="loginForm" style="width: 100%; max-width: 500px;">
                <div class="org-list">
                    {#each myOrgs as org}
                        <div class="org-item" on:click={() => handleSelectOrg(org.id)}>
                            <h3>{org.name}</h3>
                            <span class="arrow">→</span>
                        </div>
                    {/each}
                </div>
                <button style="margin-top: 20px; background-color: #666;" on:click={() => auth.signOut()}>Log Out</button>
            </div>
        </div>
    </div>

  {:else}
    <div class="loginFormHolder">
        <div class="logoHolder">
          <div class="logo">
            <h1>EventSea Admin</h1>
          </div>
        
        </div>
        <div class="forms">
        
        <div class="loginForm">
            <h2>Log In</h2>
            <form id="adminForm" class="adminForm" on:submit|preventDefault={handleLogin}>
            
            <label for="loginEmail">Email</label>
            <input type="email" name="loginEmail" id="loginEmail" bind:value={loginEmail} required />

            <label for="loginPassword">Password</label>
            <input type="password" name="loginPassword" id="loginPassword" bind:value={loginPassword} required />

            <button type="submit">Login</button>
            </form>
        </div>
        
        <h3 class="middleOr">OR</h3>
        
        <div class="createOrgForm">
            <h2>Create Organization</h2>
            <form class="adminForm" id="adminSignUp" on:submit|preventDefault={handleCreate}>
            
            <label for="orgName">Organization Name</label>
            <input type="text" name="orgName" id="orgName" bind:value={newOrgName} required/>

            <label for="newOrgEmail">Email</label>
            <input type="email" name="newOrgEmail" id="newOrgEmail" bind:value={newOrgEmail} required/>

            <label for="newPassword">Password</label>
            <input type="password" name="newPassword" id="newPassword" bind:value={newOrgPassword} required/>

            <button type="submit" disabled={creating}>
                {creating ? "Processing..." : "Create Organization"}
            </button>
            </form>
        </div>
        
        </div>
    </div>
  {/if}
</div>