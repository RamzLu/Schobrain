import { handleRegister } from "./auth/register.js";
import { handleLogin } from "./auth/login.js";

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("registerForm")) {
    document
      .getElementById("registerForm")
      .addEventListener("submit", handleRegister);
  }

  if (document.getElementById("loginForm")) {
    document
      .getElementById("loginForm")
      .addEventListener("submit", handleLogin);
  }
});
