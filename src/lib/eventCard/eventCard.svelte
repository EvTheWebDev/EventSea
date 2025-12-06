<script>
    import './eventCard.css';
  // Receive the event object as a prop
  let { event } = $props();

 /**
   * @param {string | Date} dateString
   */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
</script>

<div class="card">
  <div class="image-container">
    <img src={event.IMAGE_URL} alt={event.TITLE} />
  </div>

  <div class="content">
    <h3>{event.TITLE}</h3>

    <div class="info-row">
      <span class="icon">📅</span>
      <span>{formatDate(event.formattedDate || event.DATE)}</span>
    </div>

    <div class="info-row">
      <span class="icon">Tm</span>
      <span>{event.START_TIME} - {event.END_TIME}</span>
    </div>

    <div class="info-row">
      <span class="icon">📍</span>
      <span>{event.LOCATION}</span>
    </div>

    <div class="info-row org-row">
      <span class="icon">👥</span>
      <span class="org-name">{event.orgName}</span>
    </div>

    <div class="actions">
      <button class="btn-outline">Add to My Events</button>
      <button class="btn-outline">Learn more</button>
    </div>
  </div>
</div>
