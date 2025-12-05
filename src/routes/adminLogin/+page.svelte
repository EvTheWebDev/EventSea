<script>
    import './adminLogin.css';
    import {AdminNav} from "$lib"
  import AdminFooter from '$lib/adminFooter/adminFooter.svelte';
</script>
    <div class="siteContent">
        <h1>Login</h1>

        <form id="adminForm" action="/adminHome" class="adminForm">
    <label for="username">Username</label>
    <input type="text" name="username" id="username">

    <label for="password">Password</label>
    <input type="password" name="password" id="password">

    <button type="submit">Login</button>
        </form>
    </div>


