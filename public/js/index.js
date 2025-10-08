import { verifyAuth, logoutUser } from "./services/auth.service.js";
import {
  showAskQuestionModal,
  setupCancelButton,
  initializeSymbolsPanel, // Importamos la función centralizada
} from "./article/article.ui.js";
import {
  handlePostQuestion,
  initializeArticleFeed,
  filterArticlesByTag,
  handleDeleteArticle,
} from "./article/article.handler.js";
import { initializeLightbox } from "./utils/lightbox.js";

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

  initializeSymbolsPanel({
    textareaId: "question-content",
    toggleBtnId: "toggle-symbols-btn",
    panelId: "math-symbols-panel",
    includeFunctions: true,
    fractionBtnId: "fraction-btn",
    exponentBtnId: "exponent-btn",
  });

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

  initializeLightbox("questions-list");
};

document.addEventListener("DOMContentLoaded", initializeIndexPage);
