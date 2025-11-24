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
    <a href="/">Home</a>
    <a href="/events"
      >Events<Icon
        icon="icon-park-outline:down"
        width="18"
        height="18"
        style="color: #fff;margin-left:2px"
      /></a
    >
    <a href="/orgs"
      >Organizations<Icon
        icon="icon-park-outline:down"
        width="18"
        height="18"
        style="color: #fff;margin-left:2px"
      /></a
    >
    <a href="/profile"
      >Profile<Icon
        icon="mynaui:user-solid"
        width="18"
        height="18"
        style="color: #fff;margin-left:10px;background-color:#bebebe;border-radius:50%;"
      /></a
    >
  </div>
</nav>
