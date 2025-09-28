// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/index.js

import { verifyAuth, logoutUser } from "./services/auth.service.js";
import {
  showAskQuestionModal,
  setupCancelButton,
} from "./article/article.ui.js";
import {
  handlePostQuestion,
  initializeArticleFeed,
} from "./article/article.handler.js";

// Función para renderizar la opción de Admin
const renderAdminMenuOption = () => {
  const userMenu = document.getElementById("user-menu");
  if (userMenu) {
    const adminHtml = `
            <a href="/admin.html" id="admin-config-button">Configuración de administrador</a>
        `;
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.insertAdjacentHTML("beforebegin", adminHtml);
    } else {
      userMenu.insertAdjacentHTML("beforeend", adminHtml);
    }
  }
};

// --- Esta es la función principal que se ejecuta cuando el HTML está listo ---
const initializeIndexPage = async () => {
  // 1. Verifica la autenticación y actualiza el saludo
  let authData;
  try {
    authData = await verifyAuth();
    const usernameSpan = document.getElementById("logged-in-username");
    if (usernameSpan && authData && authData.data) {
      usernameSpan.textContent = authData.data.firstName;

      // Lógica para mostrar la opción de Admin
      if (authData.data.role === "admin") {
        renderAdminMenuOption();
      }
    }
  } catch (error) {
    // ⬇️ CORRECCIÓN: Redirección explícita si el token no es válido o está ausente.
    console.error("Error de autenticación, redirigiendo a login:", error);
    window.location.href = "/login.html";
    return;
  }

  // 2. Inicializa el feed de artículos/preguntas
  await initializeArticleFeed();

  // --- 3. Lógica del Menú Desplegable (Existente) ---
  const menuToggle = document.querySelector(".menu-toggle");
  const userMenu = document.getElementById("user-menu");

  if (menuToggle && userMenu) {
    menuToggle.addEventListener("click", () => {
      userMenu.classList.toggle("visible");
    });
    // Cierra el menú si se hace clic fuera
    document.addEventListener("click", (event) => {
      if (
        !menuToggle.contains(event.target) &&
        !userMenu.contains(event.target)
      ) {
        userMenu.classList.remove("visible");
      }
    });
  }

  // --- 3.1 Lógica de Cerrar Sesión (Existente) ---
  const logoutButton = document.getElementById("logout-button");
  const logoutModal = document.getElementById("logout-modal");
  const cancelLogoutButton = document.getElementById("cancel-logout");
  const confirmLogoutButton = document.getElementById("confirm-logout");

  if (logoutButton && logoutModal) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      userMenu.classList.remove("visible");
      logoutModal.classList.add("visible");
    });

    cancelLogoutButton.addEventListener("click", () => {
      logoutModal.classList.remove("visible");
    });

    logoutModal.addEventListener("click", (event) => {
      if (event.target === logoutModal) {
        logoutModal.classList.remove("visible");
      }
    });

    confirmLogoutButton.addEventListener("click", async () => {
      try {
        await logoutUser();
        window.location.href = "/login.html";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }

  // --- 4. Lógica del Modal de Pregunta (Existente) ---
  const askQuestionButton = document.getElementById("ask-question-button");
  const askQuestionForm = document.getElementById("askQuestionForm");
  const askQuestionModal = document.getElementById("ask-question-modal");

  if (askQuestionButton) {
    askQuestionButton.addEventListener("click", showAskQuestionModal);
  }

  if (askQuestionForm) {
    askQuestionForm.addEventListener("submit", handlePostQuestion);
    setupCancelButton();
    // Cierra el modal al hacer clic en el fondo
    if (askQuestionModal) {
      askQuestionModal.addEventListener("click", (event) => {
        if (event.target === askQuestionModal) {
          askQuestionModal.classList.remove("visible");
        }
      });
    }
  }
};

document.addEventListener("DOMContentLoaded", initializeIndexPage);
