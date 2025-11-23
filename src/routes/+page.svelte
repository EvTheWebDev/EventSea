<script>
  import "./home.css";
  import { Event } from "$lib";
  import { Org } from "$lib";
  import "../global.css";
  import Icon from "@iconify/svelte";
</script>

<main>
  <div class="homeHero">
    <div class="homeText">
      <h2>Discover. Explore.</h2>
      <h1>Set Sail.</h1>
      <p>An event hub for students, by students.</p>
      <input
        type="search"
        name="search"
        id="search"
        placeholder="Find your next adventure..."
      />
    </div>
  </div>

  <div class="trendingEvents">
    <h2 class="heading">Trending Events</h2>
    <div class="trendingEventCards">
      <Event
        img="/event1.png"
        alt="Event 1"
        name="Campus Carnival"
        description="Join us for a day of fun, food, and festivities at the annual Campus Carnival!"
        attendees={150}
        date="March 15, 2024"
        time="12:00 PM - 6:00 PM"
        location="Main Quad"
        org="Student Activities Board"
      />
      <Event
        img="/event2.png"
        alt="Event 2"
        name="Tech Talk Series"
        description="Explore the latest in technology with industry experts at our Tech Talk Series."
        attendees={200}
        date="March 20, 2024"
        time="3:00 PM - 5:00 PM"
        location="Engineering Building, Room 101"
        org="Tech Club"
      />
      <Event
        img="/event3.png"
        alt="Event 3"
        name="Art & Wine Night"
        description="Unwind with an evening of painting and wine tasting. All skill levels welcome!"
        attendees={80}
        date="March 25, 2024"
        time="7:00 PM - 9:00 PM"
        location="Art Studio"
        org="Creative Arts Society"
      />
    </div>
    <div class="more"><a id="more" href="/events">More Events</a></div>
  </div>

  <div class="category">
    <h2 class="heading">Browse by Category</h2>
    <div class="categories">
      <a href="/events?category=academic" class="categoryCard">
        <Icon
          icon="solar:square-academic-cap-bold"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Academic</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />18 events</span
        >
      </a>
      <a href="/events?category=careers" class="categoryCard">
        <Icon
          icon="tabler:briefcase"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Careers</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />18 events</span
        >
      </a>
      <a href="/events?category=worksohps" class="categoryCard">
        <Icon
          icon="grommet-icons:workshop"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Workshops</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />18 events</span
        >
      </a>
      <a href="/events?category=fun" class="categoryCard">
        <Icon
          icon="lucide:party-popper"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Fun</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />18 events</span
        >
      </a>
      <a href="/events?category=worship" class="categoryCard">
        <Icon
          icon="fa7-solid:pray"
          width="45"
          height="45"
          style="color: #1b065e"
        />
        <h3>Worship</h3>
        <span
          ><Icon
            icon="mdi:event-outline"
            class="margin"
            width="18"
            height="18"
          />18 events</span
        >
      </a>
    </div>
  </div>

  <div class="organizations">
    <h2 class="heading">Featured Organizations</h2>
    <div class="orgCards">
      <Org />
      <Org />
      <Org />
      <Org />
      <Org />
      <Org />
    </div>
    <div class="more"><a id="more" href="/orgs">More Organizations</a></div>
  </div>
</main>
