<script>
  import { goto } from "$app/navigation";
  import PostForm from "$lib/postForm/postForm.svelte"; 
  import { db } from "$lib/firebase"; 
  import { collection, addDoc, serverTimestamp } from "firebase/firestore";
  import './newPost.css';

  let { data } = $props();
  
  let orgData = $derived(data.userOrg || { orgName: "", orgID: "" });
  let orgId = $derived(orgData.orgID || "");
  let saving = $state(false);

  async function handleSave(event) {
    const { formData, finalImage } = event.detail;
    saving = true;

    try {
      const safeOrgName = orgData.orgName || orgData.name || "My Organization";
      const safeImg = finalImage || "/placeholder.jpg";

      // 1. Structure the Post Document
      const newPost = {
        title: formData.title,
        description: formData.description,
        imageUrl: safeImg,
        orgId: orgId,
        orgName: safeOrgName,
        createdAt: serverTimestamp(),
        
        // 2. Interaction Tracking
        likes: [], 
        commentCount: 0,

        // 3. THE NOTIFICATION TRIGGER: 
        // Our backend Cloud Function will look for this exact flag. 
        // If it's true, it will gather followers and send the emails/push notifications!
        notifyFollowers: true 
      };

      // 4. Save to a new 'posts' collection
      const docRef = await addDoc(collection(db, "posts"), newPost);
      
      alert("Post Created Successfully!");
      
      // 5. Redirect directly to the new unique shareable URL
      goto(`/post/${docRef.id}`);
      
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      saving = false;
    }
  }
</script>

<div class="new-post-container">
    <h2>Create a New Announcement</h2>
    
    <PostForm 
        orgName={orgData.orgName || orgData.name || "My Organization"} 
        saving={saving}
        on:save={handleSave} 
    />
</div>