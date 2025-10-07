import { verifyAuth, logoutUser } from "./services/auth.service.js";
import {
  showAskQuestionModal,
  setupCancelButton,
} from "./article/article.ui.js";
import {
  handlePostQuestion,
  initializeArticleFeed,
  filterArticlesByTag,
  handleDeleteArticle,
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

/**
 * ✅ NUEVA FUNCIÓN: Se encarga de crear y manejar el panel de símbolos.
 */
const initializeSymbolsPanel = () => {
  const toggleSymbolsBtn = document.getElementById("toggle-symbols-btn");
  const symbolsPanel = document.getElementById("math-symbols-panel");
  const questionTextarea = document.getElementById("question-content");

  if (!toggleSymbolsBtn || !symbolsPanel || !questionTextarea) return;

  const symbols = [
    "π",
    "∀",
    "≤",
    "≥",
    "∉",
    "≠",
    "∏",
    "∑",
    "¬",
    "⇔ ",
    "∧",
    "∨",
    "√",
    "∫",
    "Σ",
    "Π",
    "±",
    "≠",
    "≤",
    "≥",
    "≈",
    "∞",
    "α",
    "β",
    "γ",
    "δ",
    "θ",
    "λ",
    "μ",
    "π",
    "ω",
    "°",
    "²",
    "³",
    "₄",
    "ₓ",
  ];

  // Genera los símbolos dinámicamente
  symbols.forEach((symbol) => {
    const span = document.createElement("span");
    span.className = "symbol-char";
    span.textContent = symbol;
    symbolsPanel.appendChild(span);
  });

  // Event listener para mostrar/ocultar el panel
  toggleSymbolsBtn.addEventListener("click", () => {
    symbolsPanel.classList.toggle("visible");
  });

  // Event listener para insertar los símbolos
  symbolsPanel.addEventListener("click", (event) => {
    if (event.target.classList.contains("symbol-char")) {
      const symbol = event.target.textContent;
      const start = questionTextarea.selectionStart;
      const end = questionTextarea.selectionEnd;
      const text = questionTextarea.value;

      questionTextarea.value =
        text.substring(0, start) + symbol + text.substring(end);
      questionTextarea.selectionStart = questionTextarea.selectionEnd =
        start + symbol.length;
      questionTextarea.focus();
    }
  });
};

// --- Función principal que se ejecuta al cargar la página ---
const initializeIndexPage = async () => {
  let authData;
  try {
    authData = await verifyAuth();
    const usernameSpan = document.getElementById("logged-in-username");
    if (usernameSpan && authData && authData.data) {
      usernameSpan.textContent = authData.data.firstName;
      if (authData.data.role === "admin") {
        renderAdminMenuOption();
      }
    }
  } catch (error) {
    console.error("Error de autenticación, redirigiendo a login:", error);
    window.location.href = "/login.html";
    return;
  }

  await initializeArticleFeed(authData.data);

  // --- Lógica del Menú Desplegable ---
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

  // --- Lógica de Cerrar Sesión ---
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

    cancelLogoutButton.addEventListener("click", () =>
      logoutModal.classList.remove("visible")
    );
    logoutModal.addEventListener("click", (event) => {
      if (event.target === logoutModal) logoutModal.classList.remove("visible");
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

  // --- Lógica del Modal de "Hacer una pregunta" ---
  const askQuestionButton = document.getElementById("ask-question-button");
  const askQuestionForm = document.getElementById("askQuestionForm");
  const askQuestionModal = document.getElementById("ask-question-modal");

  if (askQuestionButton) {
    askQuestionButton.addEventListener("click", showAskQuestionModal);
  }

  if (askQuestionForm) {
    askQuestionForm.addEventListener("submit", handlePostQuestion);
    setupCancelButton();
    if (askQuestionModal) {
      askQuestionModal.addEventListener("click", (event) => {
        if (event.target === askQuestionModal) {
          askQuestionModal.classList.remove("visible");
        }
      });
    }
  }

  // ✅ LLAMADA A LA NUEVA FUNCIÓN
  initializeSymbolsPanel();

  // --- Lógica de Filtrado por Asignatura ---
  const subjectFilterList = document.getElementById("subject-filter-list");
  if (subjectFilterList) {
    subjectFilterList.addEventListener("click", (event) => {
      event.preventDefault();
      const link = event.target.closest("a");
      if (link && link.dataset.tagName) {
        filterArticlesByTag(link.dataset.tagName, authData.data);
      }
    });
  }

  // --- Lógica para el Menú de Opciones y Borrado ---
  const questionsList = document.getElementById("questions-list");
  const deleteConfirmModal = document.getElementById("delete-confirm-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  let articleIdToDelete = null;

  questionsList.addEventListener("click", (event) => {
    const toggleBtn = event.target.closest(".options-toggle-btn");
    if (toggleBtn) {
      const dropdown = toggleBtn.nextElementSibling;
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        if (d !== dropdown) d.classList.remove("visible");
      });
      dropdown.classList.toggle("visible");
    }

    const deleteBtn = event.target.closest(".delete-btn");
    if (deleteBtn) {
      articleIdToDelete = deleteBtn.dataset.id;
      deleteConfirmModal.classList.add("visible");
      deleteBtn.closest(".options-dropdown").classList.remove("visible");
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".article-options-menu")) {
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        d.classList.remove("visible");
      });
    }
  });

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

document.addEventListener("DOMContentLoaded", initializeIndexPage);
