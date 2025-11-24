<script>
  import "./nav.css";
  import Icon from "@iconify/svelte";
</script>

<nav>
  <div class="logo">
    <!-- <a href="/"><img src="/logo.png" alt="EventSea Logo" /></a> -->
    Logo
  </div>
  <div class="links">
    <li class="menuItem"><a href="/">Home</a></li>
    <li class="menuItem">
      <a href="/events">
        Events<Icon
          icon="icon-park-outline:down"
          width="18"
          height="18"
          style="color: #fff;margin-left:2px"
        /></a
      >
      <ul id="menuEvents">
        <li class="subItem"><a href="/">My Events</a></li>
        <li class="subItem"><a href="/">All Events</a></li>
      </ul>
    </li>
    <li class="menuItem">
      <a href="/orgs"
        >Organizations<Icon
          icon="icon-park-outline:down"
          width="18"
          height="18"
          style="color: #fff;margin-left:2px"
        /></a
      >
      <ul id="menuOrg">
        <li><a href="/">My Organization</a></li>
        <li><a href="/">My Announcements</a></li>
        <li><a href="/">All Organizations</a></li>
      </ul>
    </li>
    <li class="menuItem">
      <a href="/profile"
        >Profile<Icon
          icon="mynaui:user-solid"
          width="18"
          height="18"
          style="color: #fff;margin-left:10px;background-color:#bebebe;border-radius:50%;"
        /></a
      >
    </li>
  </div>
</nav>
