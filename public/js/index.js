import { verifyAuth, logoutUser } from "./services/auth.service.js";

// --- Esta es la función principal que se ejecuta cuando el HTML está listo ---
const initializeIndexPage = async () => {
  // 1. Verifica la autenticación y actualiza el saludo
  try {
    const authData = await verifyAuth();
    const usernameSpan = document.getElementById("logged-in-username");
    if (usernameSpan && authData && authData.data) {
      usernameSpan.textContent = authData.data.firstName;
    }
  } catch (error) {
    // verifyAuth ya redirige si la autenticación falla
    console.error("Error de autenticación, serás redirigido.", error);
    return; // Detiene la ejecución si no está autenticado
  }

  // --- 2. Lógica del Menú Desplegable ---
  const menuToggle = document.querySelector(".menu-toggle");
  const userMenu = document.getElementById("user-menu");
  console.log("menuToggle:", menuToggle);
  console.log("userMenu:", userMenu);
  // Comprobamos que ambos elementos existen para evitar errores
  if (menuToggle && userMenu) {
    // Mostrar/ocultar el menú al hacer clic
    menuToggle.addEventListener("click", (event) => {
      event.stopPropagation(); // Detiene la propagación del evento
      userMenu.classList.toggle("visible");
    });
  }

  // --- 3. Lógica del Botón de Cerrar Sesión ---
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", async (event) => {
      event.preventDefault();
      try {
        await logoutUser();
        alert("Has cerrado sesión correctamente.");
        window.location.href = "/login.html";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }

  // --- 4. Lógica para cerrar el menú al hacer clic fuera ---
  document.addEventListener("click", (event) => {
    if (
      userMenu &&
      menuToggle &&
      !userMenu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      userMenu.classList.remove("visible");
    }
  });
};

// --- Punto de Entrada: Ejecutar el código cuando el DOM esté listo ---
document.addEventListener("DOMContentLoaded", initializeIndexPage);
