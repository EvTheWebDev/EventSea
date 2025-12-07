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
  
  // Login Form Data
  let loginEmail = "";
  let loginPassword = "";

  // Create Org Form Data
  let newOrgName = "";
  let newOrgEmail = ""; 
  let newOrgPassword = "";
  let newOrgConfirmPassword = "";

  // Org Selection Data
  let myOrgs = [];

  // --- LIFECYCLE ---
  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const orgIds = await checkUserAdminStatus(user.uid);

        if (orgIds && orgIds.length > 0) {
          if (orgIds.length === 1) {
            // UPDATED ROUTE: Go to adminHome with query param
            goto(`/adminHome?orgId=${orgIds[0]}`);
          } else {
            myOrgs = await getOrgsByIds(orgIds);
            view = "select";
            loading = false;
          }
        } else {
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

  async function handleCreate() {
    if (newOrgPassword !== newOrgConfirmPassword) {
      return alert("Passwords do not match!");
    }
    
    try {
      await signUp(newOrgEmail, newOrgPassword, "Admin", "");

      const uid = auth.currentUser.uid;
      const newOrgId = await createOrganization(uid, newOrgName, newOrgEmail);

      // UPDATED ROUTE: Go to adminHome with query param
      goto(`/adminHome?orgId=${newOrgId}`);

    } catch (err) {
      alert("Creation Failed: " + err.message);
    }
  }

  function handleSelectOrg(orgId) {
    // UPDATED ROUTE: Go to adminHome with query param
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
        <h1>LOGO HERE</h1>
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
            <h2>Create an Account</h2>
            <form class="adminForm" id="adminSignUp" on:submit|preventDefault={handleCreate}>
            
            <label for="orgName">Organization Name</label>
            <input type="text" name="orgName" id="orgName" bind:value={newOrgName} required/>

            <label for="newOrgEmail">Email</label>
            <input type="email" name="newOrgEmail" id="newOrgEmail" bind:value={newOrgEmail} required/>

            <label for="newPassword">Password</label>
            <input type="password" name="newPassword" id="newPassword" bind:value={newOrgPassword} required/>
            
            <label for="newPasswordConfirm">Confirm Password</label>
            <input type="password" name="newPasswordConfirm" id="newPasswordConfirm" bind:value={newOrgConfirmPassword} required/>

            <button type="submit">Create Organization</button>
            </form>
        </div>
        
        </div>
    </div>
  {/if}
</div>