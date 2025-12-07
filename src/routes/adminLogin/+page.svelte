<script>
  import "./adminLogin.css";
</script>

<div class="adminLoginPage">
  <div class="loginFormHolder">
    <div class="logoHolder">
      <h1>LOGO HERE</h1>
    </div>
    <div class="forms">
      <div class="loginForm">
         <h2>Log In</h2>
        <form id="adminForm" action="/adminHome" class="adminForm">
       
        <label for="username">Username</label>
        <input type="text" name="username" id="username" />

        <label for="password">Password</label>
        <input type="password" name="password" id="password" />

        <button type="submit">Login</button>
      </form>
      </div>
      
      <h3 class="middleOr">OR</h3>
      <div class="createOrgForm">
        <h2>Create an Account</h2>
        <form action="" class="adminForm" id="adminSignUp">
        
        <label for="orgName">Organization Name</label>
        <input type="text" name="orgName" id="orgName"/>

        <label for="password">Password</label>
        <input type="password" name="password" id="password"/>
        <label for="password">Confirm Password</label>
        <input type="password" name="password" id="passwordConfirm"/>

        <button type="submit">Create Organization</button>
      </form>
      </div>
      
    </div>
  </div>
</div>
