<script>
  import { createEventDispatcher } from "svelte";
  import EventCard from "$lib/eventCard/eventCard.svelte"; 
  
  let { initialData = {}, loading = false, saving = false, orgName = "Your Org" } = $props();

  const dispatch = createEventDispatcher();

  // --- 1. HELPERS FOR TIME CONVERSION ---
  // Convert "14:30" -> { h: "2", m: "30", p: "PM" }
  function parseTime(time24) {
    if (!time24) return { h: "12", m: "00", p: "PM" }; // Default
    let [h, m] = time24.split(':').map(Number);
    const p = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12; // Convert 0 or 12 to 12
    return { h: h.toString(), m: m.toString().padStart(2,'0'), p };
  }

  // Convert "2", "30", "PM" -> "14:30"
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

  // Parse existing times (or default to 12:00 PM)
  const startObj = parseTime(initialData.START_TIME || "12:00");
  let startH = $state(startObj.h);
  let startM = $state(startObj.m);
  let startP = $state(startObj.p);

  const endObj = parseTime(initialData.END_TIME || "13:00");
  let endH = $state(endObj.h);
  let endM = $state(endObj.m);
  let endP = $state(endObj.p);

  // --- 3. DERIVED VALUES (The "Glue") ---
  // These update automatically when you change the dropdowns
  let startTime = $derived(combineTime(startH, startM, startP));
  let endTime = $derived(combineTime(endH, endM, endP));

  // Options for Dropdowns
  const hours = Array.from({length: 12}, (_, i) => (i + 1).toString());
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  // Preview Logic
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
    orgName: orgName
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
        START_TIME: startTime, // Sends "14:30" to DB
        END_TIME: endTime,
        LOCATION: location,
        DESCRIPTION: description,
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
  
  /* FIX 2: Textarea Resizing */
  textarea { 
      resize: vertical; /* Only allows up/down resizing */
      min-height: 100px; 
  } 
  
  /* Time Input Styling */
  .time-inputs {
      display: flex;
      align-items: center;
      gap: 5px;
  }
  .time-select {
      margin-bottom: 0; /* Remove default margin for inline feel */
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

  .button-row { display: flex; gap: 15px; margin-top: 20px; }
  .submit-btn { flex: 2; background-color: #2CA58D; color: white; padding: 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
  .cancel-btn { flex: 1; border: 2px solid #ccc; background: transparent; padding: 15px; border-radius: 8px; font-weight: bold; cursor: pointer; }

  @media (max-width: 900px) { .split-page-container { flex-direction: column; } }
</style>