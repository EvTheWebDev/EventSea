<script>
  import "./home.css";
  import { Event } from "$lib";
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
    <h2>Trending Events</h2>
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
  </div>

  <div class="category"></div>
</main>
