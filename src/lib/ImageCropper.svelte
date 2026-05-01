<script>
  import Cropper from "svelte-easy-crop";
  import { getCroppedImg } from "$lib/cropUtils";

  let { imageUrl, onSave, onCancel } = $props();

  let crop = $state({ x: 0, y: 0 });
  let zoom = $state(1);
  let pixels = $state(null);
  let processing = $state(false);

  // FIXED: Svelte 5 hands us the data directly, no 'detail' wrapper needed!
  /** @param {{ pixels: any, percent: any }} e */
  function handleCropComplete(e) {
    pixels = e.pixels; 
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

<div class="cropper-wrapper">
  <div class="cropper-backdrop"></div>
  
  <div class="cropper-modal">
    <h3>Crop Profile Picture</h3>
    
    <div class="crop-container">
      <Cropper
        image={imageUrl}
        bind:crop
        bind:zoom
        aspect={1}
        oncropcomplete={handleCropComplete} 
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
  /* The main container locks to the screen and centers everything */
  .cropper-wrapper {
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100vw; 
    height: 100vh;
    display: flex; 
    justify-content: center; 
    align-items: center;
    z-index: 99999; 
    padding: 20px;
    box-sizing: border-box;
  }

  /* The dark film sits completely separate in the background */
  .cropper-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
  }

  /* The white box now sits crisply above the background */
  .cropper-modal {
    position: relative; 
    background: #f8f8f8; 
    width: 100%; 
    max-width: 450px;
    border-radius: 12px; 
    display: flex; 
    flex-direction: column;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
    overflow: hidden; 
    opacity: 100%;
  }

  .cropper-modal h3 {
    text-align: center; 
    padding: 15px; 
    margin: 0;
    background: #f8f8f8; 
    border-bottom: 1px solid #eee;
    position: relative;
    z-index: 2; 
  }
  
  .crop-container {
    position: relative; 
    width: 100%;
    height: 350px; 
    background: #222;
    overflow: hidden;
    z-index: 1;
  }
  
  .cropper-controls {
    padding: 15px; 
    background: #f8f8f8; 
    display: flex; 
    justify-content: center;
    position: relative;
    z-index: 2;
  }

  .zoom-slider { width: 80%; }
  
  .cropper-actions {
    display: flex; 
    gap: 10px; 
    padding: 15px; 
    background: white;
    position: relative;
    z-index: 2;
  }

  .cancel-btn, .save-btn {
    flex: 1; padding: 12px; border: none; border-radius: 8px;
    font-weight: bold; cursor: pointer;
  }
  
  .cancel-btn { background: #e0e0e0; color: #333; }
  .save-btn { background: #2ca58d; color: white; }
</style>