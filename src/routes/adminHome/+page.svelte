<script>
  import EventCard from "$lib/eventCard/eventCard.svelte";
    import './adminHome.css';
    let { data } = $props();
    let upcomingEvents = data.upcomingEvents;
    let { followers, rsvps, orgName } = data.orgStats;

</script>

<div class="dashboard-container">
  
  <header>
    <h1>Welcome, {orgName}!</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number">{followers}</span>
        <span class="stat-label">Total Followers</span>
        <button class="btn-primary">View List</button>
      </div>

      <div class="stat-card">
        <span class="stat-number">{rsvps}</span>
        <span class="stat-label">Event RSVPs</span>
        <button class="btn-primary">View List</button>
      </div>
    </div>
  </header>

  <section class="wave-banner">
    <div class="wave-shape-top">
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#A997DF" fill-opacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </div>

    <div class="banner-content">
      <h2>Make Some Waves</h2>
      <div class="banner-actions">
        <button class="btn-banner">Create a New Event</button>
        <button class="btn-banner">Share an Announcement</button>
      </div>
    </div>
    
    </section>

  <section class="events-section">
    <h3>Your Upcoming Events</h3>
    
    <div class="events-grid">
      {#each upcomingEvents as event}
        <EventCard {event} />
      {/each}
    </div>
  </section>

</div>