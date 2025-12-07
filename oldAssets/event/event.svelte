<script>
  import "./event.css";
  import Icon from "@iconify/svelte";
  export let img = "/placeholder.jpg";
  export let alt = "Alt text for the collection image.";
  export let name = "Default Event Name";
  export let description = "Default description goes here.";
  export let attendees = 0;
  export let date = "Date";
  export let time = "Time";
  export let location = "Location";
  export let org = "Organization Name";
</script>

<div class="eventCard">
  <img src={img} {alt} class="eventImage" />
  <div class="eventText">
    <h3>{name}</h3>
    <p>{description}</p>
    <span
      ><Icon
        icon="ion:people"
        class="margin"
        width="16"
        height="16"
      />{attendees} people going</span
    >
    <br />
    <span
      ><Icon
        icon="uiw:date"
        class="margin"
        width="16"
        height="16"
      />{date}</span
    > <br />
    <span
      ><Icon
        icon="tabler:clock"
        class="margin"
        width="16"
        height="16"
      />{time}</span
    >
    <br />
    <span
      ><Icon
        icon="mingcute:location-fill"
        class="margin"
        width="16"
        height="16"
      />{location}</span
    > <br />
    <span
      ><a href="/"
        ><Icon
          icon="octicon:organization-16"
          class="margin"
          width="16"
          height="16"
        />{org}</a
      ></span
    >
    <div class="eventButtons">
      <button><a href="/savedEvents">Add to My Events</a></button>
      <button><a href="/singleEvent">Learn More</a></button>
    </div>
  </div>
</div>
