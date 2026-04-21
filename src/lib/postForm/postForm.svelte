<script>
    import { createEventDispatcher } from "svelte";

    let { orgName, saving } = $props();
    const dispatch = createEventDispatcher();

    // Local State
    let title = $state("");
    let description = $state("");
    let imagePreview = $state(null);
    let rawImageFile = $state(null);

    // Handle Image Upload Preview (Now handles GIFs!)
    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            rawImageFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview = e.target.result; 
            };
            reader.readAsDataURL(file);
        }
    }

    function handleSubmit() {
        const formData = {
            title: title.trim(),
            description: description.trim()
        };
        dispatch("save", {
            formData,
            finalImage: imagePreview 
        });
    }
</script>

<div class="split-page-container">
    <div class="form-section">
        <form class="post-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div class="author-badge">Posting as: <strong>{orgName}</strong></div>

            <label>
                Post Title
                <input type="text" bind:value={title} placeholder="Big news!" required disabled={saving} />
            </label>

            <label>
                Description
                <textarea bind:value={description} rows="4" placeholder="Tell your followers what's going on..." required disabled={saving}></textarea>
            </label>

            <label>
                Upload Image or GIF
                <input type="file" accept="image/png, image/jpeg, image/gif" onchange={handleFileChange} disabled={saving} />
            </label>

            <button type="submit" class="submit-btn" disabled={saving}>
                {saving ? "Publishing..." : "Publish Post"}
            </button>
        </form>
    </div>

    <div class="preview-section">
        <div class="preview-sticky">
            <h3>Live Preview</h3>
            
            <article class="post-card card-wrapper">
                <header class="post-header">
                    <div class="author-info">
                         <a href="#" class="org-name-link" onclick={(e) => e.preventDefault()}>
                            <span class="org-name">{orgName}</span>
                         </a>
                        <span class="post-date">Just now</span>
                    </div>
                </header>

                {#if imagePreview}
                    <img src={imagePreview} alt="Preview" class="post-hero-image" />
                {:else}
                    <div class="post-hero-image empty-image">
                        <span>Image/GIF will appear here</span>
                    </div>
                {/if}

                <div class="post-content">
                    <h1>{title || "Your Post Title"}</h1>
                    <p class="description">{description || "Your description will appear here as you type..."}</p>
                </div>

                <footer class="post-actions">
                    <button class="action-btn like-btn" disabled>🤍 0 Likes</button>
                    <button class="action-btn comment-btn" disabled>💬 0 Comments</button>
                </footer>
            </article>
        </div>
    </div>
</div>