<script>
  import "./adminLogin.css";
</script>

<div class="adminLoginPage">
    <div class="loginFormHolder">
        <h1>Login</h1>

  <form id="adminForm" action="/adminHome" class="adminForm">
    <label for="username">Username</label>
    <input type="text" name="username" id="username" />

    <label for="password">Password</label>
    <input type="password" name="password" id="password" />

    <button type="submit">Login</button>
  </form>
    </div>
  
</div>
