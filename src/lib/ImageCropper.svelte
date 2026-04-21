<script>
  import Cropper from "svelte-easy-crop";
  import { getCroppedImg } from "$lib/cropUtils";

  let { imageUrl, onSave, onCancel } = $props();

  let crop = $state({ x: 0, y: 0 });
  let zoom = $state(1);
  let pixels = $state(null);
  let processing = $state(false);

  // THE FIX: Tell Svelte that this incoming event is perfectly safe
  /** @param {any} e */
  function handleCropComplete(e) {
    pixels = e.detail.pixels;
  }

  async function handleSave() {
    if (!pixels) return;
    processing = true;

    try {
      const blob = await getCroppedImg(imageUrl, pixels);
      onSave(blob);
    } catch (err) {
      console.error("Cropping failed:", err);
      alert("Failed to crop image.");
    } finally {
      processing = false;
    }
  }
</script>

<div class="cropper-overlay">
  <div class="cropper-modal">
    <h3>Crop Profile Picture</h3>
    
    <div class="crop-container">
      <Cropper
        image={imageUrl}
        bind:crop
        bind:zoom
        aspect={1}
        on:cropcomplete={handleCropComplete}
      />
    </div>

    <div class="cropper-controls">
      <input type="range" min="1" max="3" step="0.1" bind:value={zoom} class="zoom-slider" />
    </div>

    <div class="cropper-actions">
      <button class="cancel-btn" onclick={onCancel} disabled={processing}>Cancel</button>
      <button class="save-btn" onclick={handleSave} disabled={processing}>
        {processing ? "Saving..." : "Save Picture"}
      </button>
    </div>
  </div>
</div>

<style>
  .cropper-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex; justify-content: center; align-items: center;
    z-index: 9999; padding: 20px;
  }
  .cropper-modal {
    background: white; width: 100%; max-width: 450px;
    border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;
  }
  .cropper-modal h3 {
    text-align: center; padding: 15px; margin: 0;
    background: #f8f8f8; border-bottom: 1px solid #eee;
  }
  
  /* THE FIX: Absolute boundaries so the cropper knows exactly how big to be */
  .crop-container {
    position: relative; 
    width: 100%;
    height: 350px; 
    background: #222;
    overflow: hidden;
  }
  
  .cropper-controls {
    padding: 15px; background: #f8f8f8; display: flex; justify-content: center;
  }
  .zoom-slider { width: 80%; }
  .cropper-actions {
    display: flex; gap: 10px; padding: 15px; background: white;
  }
  .cancel-btn, .save-btn {
    flex: 1; padding: 12px; border: none; border-radius: 8px;
    font-weight: bold; cursor: pointer;
  }
  .cancel-btn { background: #e0e0e0; color: #333; }
  .save-btn { background: #2ca58d; color: white; }
</style>