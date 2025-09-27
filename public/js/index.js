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
  // --- LÓGICA DEL MODAL DE LOGOUT ---
  const logoutButton = document.getElementById("logout-button");
  const logoutModal = document.getElementById("logout-modal");
  const confirmLogoutButton = document.getElementById("confirm-logout");
  const cancelLogoutButton = document.getElementById("cancel-logout");

  if (
    logoutButton &&
    logoutModal &&
    confirmLogoutButton &&
    cancelLogoutButton
  ) {
    // 1. Al hacer clic en "Cerrar Sesión", muestra el modal
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      userMenu.classList.remove("visible"); // Oculta el menú desplegable
      logoutModal.classList.add("visible");
    });

    // 2. Al hacer clic en "Cancelar", oculta el modal
    cancelLogoutButton.addEventListener("click", () => {
      logoutModal.classList.remove("visible");
    });

    // 3. Al hacer clic en el fondo, también oculta el modal
    logoutModal.addEventListener("click", (event) => {
      if (event.target === logoutModal) {
        logoutModal.classList.remove("visible");
      }
    });

    // 4. Al confirmar, cierra la sesión y redirige
    confirmLogoutButton.addEventListener("click", async () => {
      try {
        await logoutUser();
        // Opcional: podrías mostrar un pequeño mensaje de éxito antes de redirigir
        window.location.href = "/login.html";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }

  // ... (tu lógica para cerrar el menú al hacer clic fuera se mantiene igual) ...
};

document.addEventListener("DOMContentLoaded", initializeIndexPage);
