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

// --- Esta es la función principal que se ejecuta cuando el HTML está listo ---
const initializeIndexPage = async () => {
  // 1. Verifica la autenticación y actualiza el saludo
  let authData;
  try {
    authData = await verifyAuth();
    const usernameSpan = document.getElementById("logged-in-username");
    if (usernameSpan && authData && authData.data) {
      usernameSpan.textContent = authData.data.firstName;
    }
  } catch (error) {
    // verifyAuth ya redirige si la autenticación falla
    console.error("Error de autenticación, serás redirigido.", error);
    return; // Detiene la ejecución si no está autenticado
  }

  // 2. Inicializa el feed de artículos/preguntas (NEW)
  await initializeArticleFeed();

  // --- 3. Lógica del Menú Desplegable (Existente) ---
  const menuToggle = document.querySelector(".menu-toggle");
  const userMenu = document.getElementById("user-menu");

  if (menuToggle && userMenu) {
    menuToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      userMenu.classList.toggle("visible");
    });
  }

  // --- LÓGICA DEL MODAL DE LOGOUT (Existente) ---
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

  // --- 4. Lógica del Modal de Pregunta (NEW) ---
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
