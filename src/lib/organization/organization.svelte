<script>
  import "./organization.css";
  import { goto } from "$app/navigation";
  import { createEventDispatcher } from 'svelte';
  import Icon from "@iconify/svelte";
  
  import { db, auth } from "$lib/firebase"; 
  import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

  // FIX 1: Default 'org' to an empty object if it is passed as null/undefined
  let { org = {} } = $props();
  
  const dispatch = createEventDispatcher();
  let currentUser = auth.currentUser;

  // FIX 2: Create a safe followers array. If it's missing, use []
  const safeFollowers = org?.followers || [];

  // FIX 3: Use the safe array for logic
  let isFollowing = $state(
    currentUser && safeFollowers.includes(currentUser.uid)
  );
  
  let followerCount = $state(safeFollowers.length);
  let processing = $state(false);

  async function toggleFollow() {
    if (!currentUser) return goto("/login");

    processing = true;
    const orgRef = doc(db, "orgs", org.id);

    try {
        if (isFollowing) {
            await updateDoc(orgRef, { followers: arrayRemove(currentUser.uid) });
            isFollowing = false;
            followerCount--;
            dispatch('toggle', { status: false, id: org.id });
        } else {
            await updateDoc(orgRef, { followers: arrayUnion(currentUser.uid) });
            isFollowing = true;
            followerCount++;
            dispatch('toggle', { status: true, id: org.id });
        }
    } catch (err) {
        console.error(err);
        alert("Error updating follow status");
    } finally {
        processing = false;
    }
  }

  function handleView() {
    goto(`/organizations/${org.id}`);
  }
</script>

<div class="orgCard">
  <div class="flex">
    <img 
        src={org.image || "/homeHero.png"} 
        alt={org.orgName} 
        class="orgLogo" 
    />
    <div class="orgInfo">
      <h3>{org.orgName || "Unnamed Org"}</h3>
      <span>
        <Icon icon="ion:people" class="margin" width="14" height="14" />
        {followerCount} members
      </span>
    </div>
  </div>
  
  <p>{org.description || "No description provided."}</p>
  
  <div class="orgButtons">
    <button on:click={handleView}>View Organization</button>
    <button 
        on:click={toggleFollow} 
        disabled={processing}
        class:following={isFollowing}
    >
        {isFollowing ? "✓ Following" : "+ Follow"}
    </button>
  </div>
</div>

<style>
    /* Keep your existing styles */
    button.following {
        background-color: #1B065E;
        color: white;
    }
    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
</style>