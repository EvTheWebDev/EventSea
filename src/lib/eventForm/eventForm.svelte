<script>
  import { createEventDispatcher } from "svelte";
  import EventCard from "$lib/eventCard/eventCard.svelte"; 
  // NEW: Import Iconify so we can use the category icons
  import Icon from "@iconify/svelte";

  let { initialData = {}, loading = false, saving = false, orgName = "Your Org" } = $props();

  const dispatch = createEventDispatcher();

  // --- 1. HELPERS FOR TIME CONVERSION ---
  function parseTime(time24) {
    if (!time24) return { h: "12", m: "00", p: "PM" }; 
    let [h, m] = time24.split(':').map(Number);
    const p = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12; 
    return { h: h.toString(), m: m.toString().padStart(2,'0'), p };
  }

  function combineTime(h, m, p) {
    let hour = parseInt(h);
    if (p === "PM" && hour < 12) hour += 12;
    if (p === "AM" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2,'0')}:${m}`;
  }

  // --- 2. INITIALIZE STATE ---
  let title = $state(initialData.TITLE || "");
  let date = $state(initialData.DATE || "");
  let location = $state(initialData.LOCATION || "");
  let description = $state(initialData.DESCRIPTION || "");
  let imagePreview = $state(initialData.IMAGE_URL || null);

  // NEW: Initialize categories (ensure it's an array)
  let selectedCategories = $state(Array.isArray(initialData.CATEGORIES) ? initialData.CATEGORIES : []);

  const startObj = parseTime(initialData.START_TIME || "12:00");
  let startH = $state(startObj.h);
  let startM = $state(startObj.m);
  let startP = $state(startObj.p);

  const endObj = parseTime(initialData.END_TIME || "13:00");
  let endH = $state(endObj.h);
  let endM = $state(endObj.m);
  let endP = $state(endObj.p);

  // --- 3. DERIVED VALUES ---
  let startTime = $derived(combineTime(startH, startM, startP));
  let endTime = $derived(combineTime(endH, endM, endP));

  const hours = Array.from({length: 12}, (_, i) => (i + 1).toString());
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  // NEW: Category definitions matching your screenshot
  const availableCategories = [
    { id: "academic", label: "Academic", icon: "solar:square-academic-cap-bold" },
    { id: "careers", label: "Careers", icon: "tabler:briefcase" },
    { id: "workshops", label: "Workshops", icon: "grommet-icons:workshop" },
    { id: "fun", label: "Fun", icon: "lucide:party-popper" },
    { id: "worship", label: "Worship", icon: "fa7-solid:pray" }
  ];

  // NEW: Logic to toggle categories and enforce the max of 3
  function toggleCategory(catId) {
    if (selectedCategories.includes(catId)) {
      // Remove it if it's already selected
      selectedCategories = selectedCategories.filter(id => id !== catId);
    } else {
      // Check limit before adding
      if (selectedCategories.length >= 3) {
        alert("You can only select up to 3 categories for an event.");
        return;
      }
      selectedCategories = [...selectedCategories, catId];
    }
  }

  function formatTimeForPreview(time24) {
    const { h, m, p } = parseTime(time24);
    return `${h}:${m} ${p}`;
  }

  let previewEvent = $derived({
    id: "preview",
    TITLE: title || "Event Title",
    formattedDate: date ? new Date(date + 'T12:00:00') : new Date(),
    START_TIME: formatTimeForPreview(startTime),
    END_TIME: formatTimeForPreview(endTime),
    LOCATION: location || "Location",
    IMAGE_URL: imagePreview || "https://placehold.co/600x400?text=Event+Image",
    orgName: orgName,
    CATEGORIES: selectedCategories // Pass to preview
  });

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { imagePreview = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit() {
    if (!title || !date || !location) return alert("Please fill in required fields.");

    dispatch("save", {
      formData: {
        TITLE: title,
        DATE: date,
        START_TIME: startTime, 
        END_TIME: endTime,
        LOCATION: location,
        DESCRIPTION: description,
        CATEGORIES: selectedCategories // NEW: Added categories to the save payload!
      },
      finalImage: imagePreview 
    });
  }
</script>

<div class="split-page-container">
  
  <div class="form-section">
    <div class="header">
        <h1>{initialData.id ? "Edit Event" : "Create New Event"}</h1>
        <p>Fill in the details below.</p>
    </div>

    <form class="event-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      
      <div class="form-group">
        <label for="imgUpload">Event Image</label>
        <input type="file" id="imgUpload" accept="image/*" onchange={handleImageSelect} />
        {#if initialData.id && !imagePreview}
            <small style="color: #666;">Current image loaded.</small>
        {/if}
      </div>

      <div class="form-group">
        <label for="title">Event Title</label>
        <input type="text" id="title" bind:value={title} required />
      </div>

      <div class="form-group">
        <label for="date">Date</label>
        <input type="date" id="date" bind:value={date} required />
      </div>

      <div class="row">
        <div class="form-group half">
            <label for="startH">Start Time</label>
            <div class="time-inputs">
                <select bind:value={startH} class="time-select">
                    {#each hours as h} <option value={h}>{h}</option> {/each}
                </select>
                <span class="colon">:</span>
                <select bind:value={startM} class="time-select">
                    {#each minutes as m} <option value={m}>{m}</option> {/each}
                </select>
                <select bind:value={startP} class="time-select ampm">
                    {#each periods as p} <option value={p}>{p}</option> {/each}
                </select>
            </div>
        </div>

        <div class="form-group half">
            <label for="endH">End Time</label>
            <div class="time-inputs">
                <select bind:value={endH} class="time-select">
                    {#each hours as h} <option value={h}>{h}</option> {/each}
                </select>
                <span class="colon">:</span>
                <select bind:value={endM} class="time-select">
                    {#each minutes as m} <option value={m}>{m}</option> {/each}
                </select>
                <select bind:value={endP} class="time-select ampm">
                    {#each periods as p} <option value={p}>{p}</option> {/each}
                </select>
            </div>
        </div>
      </div>

      <div class="form-group">
        <label for="location">Location</label>
        <input type="text" id="location" bind:value={location} required />
      </div>

      <div class="form-group">
        <label>Event Categories (Select up to 3)</label>
        <div class="category-grid">
          {#each availableCategories as cat}
            <button
              type="button"
              class="category-select-card {selectedCategories.includes(cat.id) ? 'selected' : ''}"
              onclick={() => toggleCategory(cat.id)}
            >
              <Icon icon={cat.icon} width="36" height="36" />
              <span class="cat-label">{cat.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label for="desc">Description / Notes</label>
        <textarea id="desc" bind:value={description} rows="4"></textarea>
      </div>

      <div class="button-row">
        {#if initialData.id}
             <button type="button" class="cancel-btn" onclick={() => history.back()} disabled={saving}>Cancel</button>
        {/if}
        
        <button type="submit" class="submit-btn" disabled={loading || saving}>
            {#if saving} Saving... 
            {:else if loading} Loading... 
            {:else} {initialData.id ? "Save Changes" : "Publish Event"} 
            {/if}
        </button>
      </div>

    </form>
  </div>

  <div class="preview-section">
    <div class="preview-sticky">
        <h2>Live Preview</h2>
        <div class="card-wrapper">
            <EventCard event={previewEvent} isAdmin={false} />
        </div>
    </div>
  </div>
</div>

<style>
  .split-page-container { display: flex; min-height: 100vh; background-color: #f4f4f9; gap: 20px;}
  .form-section { flex: 1; padding: 40px; background: white; }
  .preview-section { flex: 1; background-color: #e0e0e0; display: flex; justify-content: center; padding: 40px; }
  .preview-sticky { position: sticky; top: 40px; width: 100%; display: flex; flex-direction: column; align-items: center; }
  .card-wrapper { transform: scale(1.1); pointer-events: none; margin-top: 20px;}
  
  .row { display: flex; gap: 20px; }
  .half { flex: 1; }
  
  input, select, textarea { 
      width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px;
      background: #fafafa;
  }
  
  textarea { 
      resize: vertical; 
      min-height: 100px; 
  } 
  
  .time-inputs {
      display: flex;
      align-items: center;
      gap: 5px;
  }
  .time-select {
      margin-bottom: 0; 
      padding: 10px 5px;
      text-align: center;
  }
  .ampm {
      background-color: #eef;
      font-weight: bold;
      color: #1B065E;
  }
  .colon {
      font-weight: bold;
      font-size: 1.2rem;
      margin-bottom: 5px;
  }

  /* --- NEW: CATEGORY CARD STYLES --- */
  .category-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .category-select-card {
    flex: 1;
    min-width: 90px;
    background: white;
    border: 2px solid #ddd;
    border-radius: 12px;
    padding: 15px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #1B065E;
    font-family: 'Mont-Semi', sans-serif;
  }
  
  .category-select-card:hover {
    border-color: #1B065E;
    background: #f8f8fb;
    transform: translateY(-2px);
  }
  
  /* The active/selected state (Matches your Teal theme) */
  .category-select-card.selected {
    border-color: #2CA58D;
    background: #eafffa;
    color: #2CA58D;
  }

  .cat-label {
    font-size: 0.9rem;
  }

  .button-row { display: flex; gap: 15px; margin-top: 20px; }
  .submit-btn { flex: 2; background-color: #2CA58D; color: white; padding: 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
  .cancel-btn { flex: 1; border: 2px solid #ccc; background: transparent; padding: 15px; border-radius: 8px; font-weight: bold; cursor: pointer; }

  @media (max-width: 900px) { .split-page-container { flex-direction: column; } }
</style>