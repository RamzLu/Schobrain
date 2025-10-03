import { verifyAuth, logoutUser } from "./services/auth.service.js";
import {
  showAskQuestionModal,
  setupCancelButton,
} from "./article/article.ui.js";
import {
  handlePostQuestion,
  initializeArticleFeed,
  filterArticlesByTag,
  handleDeleteArticle, // Se importa el manejador de borrado
} from "./article/article.handler.js";

// Función para renderizar la opción de Admin en el menú de usuario
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

// --- Función principal que se ejecuta al cargar la página ---
const initializeIndexPage = async () => {
  let authData;
  try {
    // 1. Verifica la autenticación del usuario
    authData = await verifyAuth();
    const usernameSpan = document.getElementById("logged-in-username");
    if (usernameSpan && authData && authData.data) {
      usernameSpan.textContent = authData.data.firstName;
      // Muestra la opción de admin si el rol es 'admin'
      if (authData.data.role === "admin") {
        renderAdminMenuOption();
      }
    }
  } catch (error) {
    // Si la autenticación falla, redirige al login
    console.error("Error de autenticación, redirigiendo a login:", error);
    window.location.href = "/login.html";
    return;
  }

  // 2. Inicializa el feed de preguntas, pasando los datos del usuario actual
  // para que la UI pueda gestionar los permisos (ej. botón de borrar)
  await initializeArticleFeed(authData.data);

  // --- 3. Lógica del Menú Desplegable de Usuario ---
  const menuToggle = document.querySelector(".menu-toggle");
  const userMenu = document.getElementById("user-menu");

  if (menuToggle && userMenu) {
    menuToggle.addEventListener("click", () => {
      userMenu.classList.toggle("visible");
    });
    document.addEventListener("click", (event) => {
      if (
        !menuToggle.contains(event.target) &&
        !userMenu.contains(event.target)
      ) {
        userMenu.classList.remove("visible");
      }
    });
  }

  // --- 4. Lógica de Cerrar Sesión ---
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

  // --- 5. Lógica del Modal de "Hacer una pregunta" ---
  const askQuestionButton = document.getElementById("ask-question-button");
  const askQuestionForm = document.getElementById("askQuestionForm");
  const askQuestionModal = document.getElementById("ask-question-modal");

  if (askQuestionButton) {
    askQuestionButton.addEventListener("click", showAskQuestionModal);
  }

  if (askQuestionForm) {
    askQuestionForm.addEventListener("submit", handlePostQuestion);
    setupCancelButton(); // Configura los botones de cerrar del modal
    if (askQuestionModal) {
      askQuestionModal.addEventListener("click", (event) => {
        if (event.target === askQuestionModal) {
          askQuestionModal.classList.remove("visible");
        }
      });
    }
  }

  // --- 6. Lógica de Filtrado por Asignatura ---
  const subjectFilterList = document.getElementById("subject-filter-list");
  if (subjectFilterList) {
    subjectFilterList.addEventListener("click", (event) => {
      event.preventDefault();
      const link = event.target.closest("a");
      if (link && link.dataset.tagName) {
        const tagName = link.dataset.tagName;
        // Pasamos el usuario para que al recargar las preguntas se mantengan los permisos
        filterArticlesByTag(tagName, authData.data);
      }
    });
  }

  // --- 7. Lógica para el Menú de Opciones y Borrado de Preguntas ---
  const questionsList = document.getElementById("questions-list");
  const deleteConfirmModal = document.getElementById("delete-confirm-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  let articleIdToDelete = null;

  questionsList.addEventListener("click", (event) => {
    // Manejar la apertura/cierre del menú de tres puntos
    const toggleBtn = event.target.closest(".options-toggle-btn");
    if (toggleBtn) {
      const dropdown = toggleBtn.nextElementSibling;
      // Cierra otros menús que puedan estar abiertos
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        if (d !== dropdown) d.classList.remove("visible");
      });
      dropdown.classList.toggle("visible");
    }

    // Manejar el clic en el botón de "Eliminar" del menú
    const deleteBtn = event.target.closest(".delete-btn");
    if (deleteBtn) {
      articleIdToDelete = deleteBtn.dataset.id;
      deleteConfirmModal.classList.add("visible"); // Muestra el modal de confirmación
      deleteBtn.closest(".options-dropdown").classList.remove("visible"); // Cierra el menú
    }
  });

  // Cierra el menú de opciones si se hace clic fuera de él
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".article-options-menu")) {
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        d.classList.remove("visible");
      });
    }
  });

  // Lógica del modal de confirmación de borrado
  confirmDeleteBtn.addEventListener("click", () => {
    if (articleIdToDelete) {
      handleDeleteArticle(articleIdToDelete);
      deleteConfirmModal.classList.remove("visible");
      articleIdToDelete = null;
    }
  });

  cancelDeleteBtn.addEventListener("click", () => {
    deleteConfirmModal.classList.remove("visible");
    articleIdToDelete = null;
  });

  deleteConfirmModal.addEventListener("click", (event) => {
    if (event.target === deleteConfirmModal) {
      deleteConfirmModal.classList.remove("visible");
    }
  });
};

// Ejecuta la función principal cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", initializeIndexPage);
