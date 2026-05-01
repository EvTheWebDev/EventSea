<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";

  import { db } from "$lib/firebase";
  import { doc, getDoc } from "firebase/firestore";

  let orgId = "";
  let orgName = $state("");
  let loading = $state(true);
  let errorMsg = $state("");

  // We will store all fetched users here
  let allMembers = $state([]);

  onMount(async () => {
    orgId = $page.url.searchParams.get("orgId");
    if (!orgId) {
      goto("/adminLogin");
      return;
    }
    await loadRoster();
  });

  async function loadRoster() {
    try {
      loading = true;
      const orgRef = doc(db, "orgs", orgId);
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const data = orgSnap.data();
        orgName = data.orgName || "Organization";

        // Grab arrays of UIDs (defaulting to empty arrays if they don't exist yet)
        const adminUids = data.adminUids || [];
        const memberUids = data.memberUids || [];

        // Combine into one unique list so we don't fetch the same user twice
        const uniqueUids = [...new Set([...adminUids, ...memberUids])];

        // Fetch all user documents
        const fetchedUsers = await Promise.all(
          uniqueUids.map(async (uid) => {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const uData = userSnap.data();
              return {
                uid: uid,
                name: uData.name || uData.displayName || "Unknown User",
                email: uData.email || "No Email",
                profilePic: uData.profilePicture || "/blankUser.png",
                // Flag them as an officer if their UID is in the admin array
                isOfficer: adminUids.includes(uid)
              };
            }
            return null; // Ignore deleted/missing users
          })
        );

        // Filter out any nulls from missing users
        allMembers = fetchedUsers.filter(user => user !== null);

      } else {
        errorMsg = "Organization not found.";
      }
    } catch (err) {
      console.error("Error loading roster:", err);
      errorMsg = "Failed to load the member list.";
    } finally {
      loading = false;
    }
  }

  // --- SVELTE 5 DERIVED STATE FOR SORTING ---
  // This automatically keeps officers at the top, and sorts the rest alphabetically
  let sortedRoster = $derived(
    [...allMembers].sort((a, b) => {
      // 1. Sort by Officer status first
      if (a.isOfficer && !b.isOfficer) return -1;
      if (!a.isOfficer && b.isOfficer) return 1;
      
      // 2. Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    })
  );

  function goBack() {
    goto(`/adminHome?orgId=${orgId}`);
  }
</script>

<main class="roster-page">
  <div class="nav-placeholder">
    <button class="back-btn" onclick={goBack}>← Back to Dashboard</button>
  </div>

  <div class="roster-header">
    <h1>Member Roster</h1>
    <p class="subtitle">Viewing all members for {orgName}</p>
  </div>

  {#if loading}
    <div class="status-container">
      <p>Loading roster...</p>
    </div>
  {:else if errorMsg}
    <div class="status-container">
      <p class="error-text">{errorMsg}</p>
    </div>
  {:else}
    <div class="roster-container">
      <div class="roster-grid">
        
        {#each sortedRoster as member (member.uid)}
          <div class="member-card {member.isOfficer ? 'officer-card' : ''}">
            
            <div class="member-avatar">
              <img src={member.profilePic} alt="{member.name}'s Profile" />
            </div>

            <div class="member-info">
              <h3>{member.name}</h3>
              <p class="email">
                <Icon icon="mdi:email-outline" width="16" height="16" />
                {member.email}
              </p>
            </div>

            <div class="member-badge">
              {#if member.isOfficer}
                <span class="badge officer-badge">
                  <Icon icon="solar:star-bold" width="14" height="14" />
                  Officer
                </span>
              {:else}
                <span class="badge regular-badge">Member</span>
              {/if}
            </div>

          </div>
        {/each}

        {#if sortedRoster.length === 0}
          <div class="empty-state">
            <p>No members found in this organization yet.</p>
          </div>
        {/if}

      </div>
    </div>
  {/if}
</main>

<style>
  /* --- PAGE LAYOUT --- */
  .roster-page {
    min-height: 100vh;
    background-color: #f4f4f9;
    /* padding-bottom: 60px; */
  }

  .nav-placeholder {
    padding: 20px 40px;
  }

  .back-btn {
    background: none;
    border: none;
    color: #1B065E;
    cursor: pointer;
    font-family: 'Mont-Bold', sans-serif;
    font-size: 1.05rem;
    display: flex;
    align-items: center;
    transition: opacity 0.2s ease;
  }

  .back-btn:hover {
    opacity: 0.7;
  }

  .roster-header {
    text-align: center;
    margin-top: 20px;
    margin-bottom: 40px;
  }

  .roster-header h1 {
    font-family: 'Mont-Bold', sans-serif;
    color: #1B065E;
    font-size: 2.5rem;
    margin: 0 0 10px 0;
  }

  .subtitle {
    color: #666;
    font-family: 'Mont-Medium', sans-serif;
    font-size: 1.1rem;
    margin: 0;
  }

  .status-container {
    text-align: center;
    font-family: 'Mont-Semi', sans-serif;
    color: #1B065E;
    font-size: 1.2rem;
    margin-top: 50px;
  }

  .error-text {
    color: #a40000;
  }

  /* --- GRID LAYOUT --- */
  .roster-container {
    width: 90%;
    max-width: 1000px;
    margin: 0 auto;
  }

  .roster-grid {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  /* --- MEMBER CARD STYLING --- */
  .member-card {
    display: flex;
    align-items: center;
    background: white;
    padding: 20px 25px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 2px solid transparent;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .member-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  /* THE OFFICER HIGHLIGHT */
  .officer-card {
    border: 2px solid #2CA58D;
    background: #f4fcfa; /* Very light teal background tint */
  }

  .member-avatar {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 20px;
    border: 2px solid #e0e0e0;
  }

  .officer-card .member-avatar {
    border-color: #2CA58D;
  }

  .member-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .member-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .member-info h3 {
    margin: 0 0 5px 0;
    font-family: 'Mont-Bold', sans-serif;
    font-size: 1.3rem;
    color: #1B065E;
  }

  .email {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #555;
    font-family: 'Mont-Medium', sans-serif;
    font-size: 0.95rem;
  }

  /* --- BADGES --- */
  .member-badge {
    display: flex;
    align-items: center;
  }

  .badge {
    padding: 6px 14px;
    border-radius: 20px;
    font-family: 'Mont-Bold', sans-serif;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .officer-badge {
    background-color: #2CA58D;
    color: white;
  }

  .regular-badge {
    background-color: #e0e0e0;
    color: #555;
  }

  /* --- MOBILE RESPONSIVENESS --- */
  @media (max-width: 600px) {
    .member-card {
      flex-direction: column;
      text-align: center;
      gap: 15px;
      padding: 25px 20px;
    }

    .member-avatar {
      margin-right: 0;
      width: 80px;
      height: 80px;
    }

    .email {
      justify-content: center;
    }

    .member-badge {
      margin-top: 10px;
    }
  }
</style>