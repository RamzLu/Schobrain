import { verifyAuth, logoutUser } from "./services/auth.service.js";
import {
  showAskQuestionModal,
  setupCancelButton,
  initializeSymbolsPanel,
  loadArticles,
} from "./article/article.ui.js";
import {
  handlePostQuestion,
  initializeArticleFeed,
  filterArticlesByTag,
  handleDeleteArticle,
} from "./article/article.handler.js";
import { initializeLightbox } from "./utils/lightbox.js";
import {
  voteOnArticle,
  searchArticles,
  fetchArticleById,
  updateArticle,
} from "./services/article.service.js";
import { showSuccessToast, showErrorToast } from "./utils/notifications.js";
import { fetchAllTags } from "./services/tag.service.js";

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

  const searchBar = document.querySelector(".search-bar");
  const searchInput = searchBar.querySelector("input");
  const searchButton = searchBar.querySelector(".search-button");

  const performSearch = async () => {
    const query = searchInput.value.trim();
    if (!query) {
      showErrorToast("Por favor, ingresa un término para buscar.");
      return;
    }
    try {
      const results = await searchArticles(query);
      loadArticles(results, authData.data);
      showSuccessToast(`${results.length} resultados para "${query}"`);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
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

  const editQuestionModal = document.getElementById("edit-question-modal");
  const editQuestionForm = document.getElementById("editQuestionForm");
  const cancelEditBtn = document.getElementById("cancel-edit-question");

  const openEditModal = async (articleId) => {
    try {
      const article = await fetchArticleById(articleId);
      document.getElementById("edit-article-id").value = article._id;
      document.getElementById("edit-question-content").value = article.content;

      const tagSelect = document.getElementById("edit-tag-select");
      const tags = await fetchAllTags();
      tagSelect.innerHTML = "";
      tags.forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag._id;
        option.textContent = tag.name;
        if (article.tags[0] && tag._id === article.tags[0]._id) {
          option.selected = true;
        }
        tagSelect.appendChild(option);
      });

      editQuestionModal.classList.add("visible");
    } catch (error) {
      showErrorToast("Error al cargar los datos de la pregunta.");
    }
  };
  questionsList.addEventListener("click", async (event) => {
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

    const editBtn = event.target.closest(".edit-btn");
    if (editBtn) {
      const articleId = editBtn.dataset.id;
      openEditModal(articleId);
      editBtn.closest(".options-dropdown").classList.remove("visible");
    }

    const voteBtn = event.target.closest(".vote-btn");
    if (voteBtn) {
      const articleId = voteBtn.dataset.articleId;
      const voteType = voteBtn.dataset.voteType;

      try {
        const updatedVotes = await voteOnArticle(articleId, voteType);
        const articleCard = document.querySelector(
          `.article-card[data-id="${articleId}"]`
        );
        if (articleCard) {
          articleCard.querySelector(".like-count").textContent =
            updatedVotes.likes;
          articleCard.querySelector(".dislike-count").textContent =
            updatedVotes.dislikes;

          const likeBtn = articleCard.querySelector(".vote-btn.like");
          const dislikeBtn = articleCard.querySelector(".vote-btn.dislike");
          const userId = authData.data.id;
          likeBtn.classList.toggle(
            "active",
            updatedVotes.votedUp.includes(userId)
          );
          dislikeBtn.classList.toggle(
            "active",
            updatedVotes.votedDown.includes(userId)
          );
        }
      } catch (error) {
        showErrorToast(error.message);
      }
    }
  });

  editQuestionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const articleId = document.getElementById("edit-article-id").value;
    const formData = new FormData(event.target);

    try {
      await updateArticle(articleId, formData);
      showSuccessToast("Pregunta actualizada con éxito.");
      editQuestionModal.classList.remove("visible");
      initializeArticleFeed(authData.data);
    } catch (error) {
      showErrorToast(error.message);
    }
  });

  cancelEditBtn.addEventListener("click", () => {
    editQuestionModal.classList.remove("visible");
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
