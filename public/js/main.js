import { handleRegister } from "./auth/register.js";
import { handleLogin } from "./auth/login.js";

// === INICIO DE LA MODIFICACIÓN ===
/**
 * Función para manejar el clic en el ícono de ver/ocultar contraseña.
 * @param {Event} event - El evento de clic.
 */
const togglePasswordVisibility = (event) => {
  // 1. Obtener el ícono (ej. <i class="fas fa-eye">)
  const icon = event.currentTarget.querySelector("i");
  // 2. Obtener el elemento padre (el .input-group)
  const inputGroup = event.currentTarget.parentElement;
  // 3. Buscar el input de contraseña dentro del padre
  const input = inputGroup.querySelector(
    'input[type="password"], input[type="text"]'
  );

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
};
// === FIN DE LA MODIFICACIÓN ===

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("registerForm")) {
    document
      .getElementById("registerForm")
      .addEventListener("submit", handleRegister);

    // === INICIO DE LA MODIFICACIÓN ===
    // 1. Seleccionar todos los íconos de toggle en el formulario de registro
    const toggleIcons = document.querySelectorAll(
      "#registerForm .password-toggle-icon"
    );
    // 2. Añadir el listener a cada uno
    toggleIcons.forEach((icon) => {
      icon.addEventListener("click", togglePasswordVisibility);
    });
    // === FIN DE LA MODIFICACIÓN ===
  }

  if (document.getElementById("loginForm")) {
    document
      .getElementById("loginForm")
      .addEventListener("submit", handleLogin);

    // === INICIO DE LA MODIFICACIÓN ===
    // 1. Seleccionar el ícono de toggle en el formulario de login
    const loginToggle = document.querySelector(
      "#loginForm .password-toggle-icon"
    );
    // 2. Añadir el listener
    if (loginToggle) {
      loginToggle.addEventListener("click", togglePasswordVisibility);
    }
    // === FIN DE LA MODIFICACIÓN ===
  }
});
