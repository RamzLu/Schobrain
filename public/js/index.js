// public/js/index.js
import { verifyAuth, logoutUser } from "./services/auth.service.js";
import {
  showAskQuestionModal,
  setupCancelButton,
  initializeSymbolsPanel,
  loadArticles,
  renderArticleCard,
} from "./article/article.ui.js";
import {
  handlePostQuestion,
  initializeArticleFeed as initializeFeed,
  filterArticlesByTag as handleFilterArticlesByTag,
  handleDeleteArticle,
} from "./article/article.handler.js";
import { initializeLightbox } from "./utils/lightbox.js";
import {
  voteOnArticle,
  searchArticles,
  fetchArticleById,
  updateArticle,
  toggleFavoriteArticle,
  fetchAllArticles,
  fetchArticlesByTag,
} from "./services/article.service.js";
import { showSuccessToast, showErrorToast } from "./utils/notifications.js";
import { fetchAllTags } from "./services/tag.service.js";
import { getProfile } from "./services/profile.service.js";
import { debounce } from "./utils/debounce.js";

// Guarda la lista actual de IDs favoritos del usuario
let currentUserFavorites = [];
let allQuestionsCache = [];
let searchHistory = [];
let isSearchFocused = false;
let currentAuthData = null;

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

const initializeArticleFeed = async (currentUser) => {
  try {
    const profileData = await getProfile();
    currentUserFavorites = profileData.favorites || [];
    await initializeFeed(currentUser, currentUserFavorites);
    allQuestionsCache = await fetchAllArticles();
  } catch (error) {
    console.error("Error al inicializar el feed con favoritos:", error);
    showErrorToast(
      "No se pudo cargar la información de favoritos. Mostrando todas las preguntas."
    );
    await initializeFeed(currentUser);
  }
};

// =================================================================
// === Lógica de la Barra de Búsqueda ===
// =================================================================

const loadSearchHistory = () => {
  const saved = localStorage.getItem("searchHistory");
  if (saved) {
    searchHistory = JSON.parse(saved);
  }
};

const saveSearchHistory = () => {
  localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
};

const renderHistory = () => {
  const historySection = document.getElementById("search-history-section");
  const historyList = document.getElementById("search-history-list");
  if (!historySection || !historyList) return;

  if (searchHistory.length > 0) {
    historySection.style.display = "block";
    historyList.innerHTML = searchHistory
      .map(
        (item) =>
          `<button class="history-item-btn" data-query="${item}">${item}</button>`
      )
      .join("");
  } else {
    historySection.style.display = "none";
  }
};

const clearHistory = () => {
  searchHistory = [];
  saveSearchHistory();
  renderHistory();
};

const getSubjectColorClass = (subjectName) => {
  const subjectColors = {
    Matemáticas: "result-subject-math",
    Biología: "result-subject-biologia",
    Historia: "result-subject-historia",
    Literatura: "result-subject-literatura",
  };
  return subjectColors[subjectName] || "result-subject-default";
};

const renderResults = (questions) => {
  const resultsList = document.getElementById("search-results-list");
  if (!resultsList) return;

  if (questions.length === 0) {
    resultsList.innerHTML = `<li class="no-results-item">No se encontraron preguntas</li>`;
    return;
  }

  resultsList.innerHTML = questions
    .map((question) => {
      const subject = question.tags?.[0]?.name || "General";
      const subjectColor = getSubjectColorClass(subject);
      const authorName = question.author?.username || "Anónimo";

      return `
      <li class="search-result-item" data-article-id="${question._id}">
        <div class="result-header">
          <span class="result-subject ${subjectColor}">${subject}</span>
        </div>
        <p class="result-title">${question.content}</p>
        <span class="result-author">Pregunta por ${authorName}</span>
      </li>
    `;
    })
    .join("");
};

const performDropdownSearch = () => {
  const searchInput = document.getElementById("action-search-input");
  const resultsList = document.getElementById("search-results-list");
  const historySection = document.getElementById("search-history-section");
  if (!searchInput || !resultsList || !historySection) return;

  const query = searchInput.value.trim().toLowerCase();
  updateSearchIcon(query);

  if (!query) {
    resultsList.innerHTML = "";
    resultsList.style.display = "none";
    renderHistory();
    return;
  }

  historySection.style.display = "none";
  resultsList.style.display = "block";

  const filteredQuestions = allQuestionsCache.filter((question) => {
    const subject = question.tags?.[0]?.name || "";
    const searchableText =
      `${question.content} ${subject} ${question.author?.username}`.toLowerCase();
    return searchableText.includes(query);
  });

  renderResults(filteredQuestions);
};

const executeMainSearch = async () => {
  const searchInput = document.getElementById("action-search-input");
  if (!searchInput) return;

  const query = searchInput.value.trim();
  if (!query) {
    showErrorToast("Por favor, ingresa un término para buscar.");
    return;
  }

  searchHistory = [
    query,
    ...searchHistory.filter((item) => item !== query),
  ].slice(0, 5);
  saveSearchHistory();

  try {
    const results = await searchArticles(query);
    loadArticles(results, currentAuthData, currentUserFavorites);
    showSuccessToast(`${results.length} resultados para "${query}"`);
    searchInput.blur();
  } catch (error) {
    showErrorToast(error.message);
  }
};

const updateSearchIcon = (query) => {
  const searchIcon = document.getElementById("action-search-icon");
  const sendIcon = document.getElementById("action-send-icon");
  if (!searchIcon || !sendIcon) return;

  if (query.length > 0) {
    searchIcon.style.display = "none";
    sendIcon.style.display = "block";
  } else {
    searchIcon.style.display = "block";
    sendIcon.style.display = "none";
  }
};

const initializeActionSearchBar = (authData) => {
  currentAuthData = authData;
  const searchWrapper = document.getElementById("action-search-bar-wrapper");
  const searchInput = document.getElementById("action-search-input");
  const searchPanel = document.getElementById("action-search-panel");
  const clearHistoryBtn = document.getElementById("search-history-clear-btn");
  const resultsList = document.getElementById("search-results-list");
  const historyList = document.getElementById("search-history-list");
  const sendIcon = document.getElementById("action-send-icon");

  if (
    !searchWrapper ||
    !searchInput ||
    !searchPanel ||
    !clearHistoryBtn ||
    !resultsList ||
    !historyList ||
    !sendIcon
  ) {
    return;
  }

  loadSearchHistory();

  const debouncedDropdownSearch = debounce(performDropdownSearch, 200);

  searchInput.addEventListener("input", () => {
    debouncedDropdownSearch();
  });

  searchInput.addEventListener("focus", () => {
    isSearchFocused = true;
    searchPanel.classList.add("visible");
    performDropdownSearch();
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (isSearchFocused) {
        isSearchFocused = false;
        searchPanel.classList.remove("visible");
      }
    }, 200);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      executeMainSearch();
    }
    if (event.key === "Escape") {
      searchInput.blur();
    }
  });

  sendIcon.addEventListener("click", executeMainSearch);
  clearHistoryBtn.addEventListener("click", clearHistory);

  resultsList.addEventListener("click", (event) => {
    const item = event.target.closest(".search-result-item");
    if (item) {
      const articleId = item.dataset.articleId;
      const question = allQuestionsCache.find((q) => q._id === articleId);
      if (question) {
        const historyText =
          question.content.length > 40
            ? question.content.substring(0, 40) + "..."
            : question.content;
        searchHistory = [
          historyText,
          ...searchHistory.filter((h) => h !== historyText),
        ].slice(0, 5);
        saveSearchHistory();
      }
      window.location.href = `/pregunta.html?id=${articleId}`;
    }
  });

  historyList.addEventListener("click", (event) => {
    const item = event.target.closest(".history-item-btn");
    if (item) {
      const query = item.dataset.query;
      searchInput.value = query;
      isSearchFocused = true;
      performDropdownSearch();
      searchInput.focus();
    }
  });
};

// =================================================================
// === Inicialización Principal ===
// =================================================================

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
  });

  initializeActionSearchBar(authData.data);

  const subjectFilterList = document.getElementById("subject-filter-list");
  if (subjectFilterList) {
    subjectFilterList.addEventListener("click", async (event) => {
      event.preventDefault();
      const link = event.target.closest("a");
      if (link && link.dataset.tagName) {
        const tagName = link.dataset.tagName;
        try {
          let articles;
          if (tagName === "all") {
            articles = await fetchAllArticles();
          } else {
            articles = await fetchArticlesByTag(tagName);
          }
          loadArticles(articles, authData.data, currentUserFavorites);
        } catch (error) {
          console.error(`Error al filtrar por ${tagName}:`, error);
          showErrorToast(`Error al filtrar: ${error.message}`);
        }
      }
    });
  }

  // --- Lógica para Modales (Eliminar, Editar) ---
  const questionsList = document.getElementById("questions-list");
  const deleteConfirmModal = document.getElementById("delete-confirm-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  let articleIdToDelete = null;

  const editQuestionModal = document.getElementById("edit-question-modal");
  const editQuestionForm = document.getElementById("editQuestionForm");
  const cancelEditBtn = document.getElementById("cancel-edit-question");
  const closeEditModalBtn = document.getElementById("close-edit-modal");

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
        if (
          article.tags &&
          article.tags[0] &&
          tag._id === article.tags[0]._id
        ) {
          option.selected = true;
        }
        tagSelect.appendChild(option);
      });

      const currentImagesPreview = document.getElementById(
        "current-images-preview"
      );
      if (currentImagesPreview) {
        currentImagesPreview.innerHTML = "";
        if (article.imageUrls && article.imageUrls.length > 0) {
          article.imageUrls.forEach((url) => {
            const imgContainer = document.createElement("div");
            imgContainer.style.position = "relative";
            imgContainer.style.display = "inline-block";
            imgContainer.style.margin = "5px";
            imgContainer.classList.add("image-preview-item");

            imgContainer.innerHTML = `
              <img src="${url}" alt="Imagen actual" style="max-width: 100px; height: auto; display: block;">
              <button type="button" class="remove-image-btn" data-url="${url}" style="position: absolute; top: 2px; right: 2px; background: rgba(255,0,0,0.7); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; line-height: 18px;">&times;</button>
            `;
            currentImagesPreview.appendChild(imgContainer);
          });
        } else {
          currentImagesPreview.innerHTML = "<p>No hay imágenes adjuntas.</p>";
        }
      }

      const editFileInput = document.getElementById("edit-image-files");
      const editFileNameDisplay = document.getElementById(
        "edit-file-name-display"
      );
      if (editFileInput) editFileInput.value = "";
      if (editFileNameDisplay)
        editFileNameDisplay.textContent = "Ningún archivo seleccionado";

      editQuestionModal.classList.add("visible");

      initializeSymbolsPanel({
        textareaId: "edit-question-content",
        toggleBtnId: "edit-toggle-symbols-btn",
        panelId: "edit-math-symbols-panel",
        includeFunctions: true,
      });
    } catch (error) {
      showErrorToast("Error al cargar los datos de la pregunta para editar.");
      console.error("Error en openEditModal:", error);
    }
  };

  questionsList?.addEventListener("click", async (event) => {
    const toggleBtn = event.target.closest(".options-toggle-btn");
    if (toggleBtn) {
      const dropdown = toggleBtn.nextElementSibling;
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        if (d !== dropdown) d.classList.remove("visible");
      });
      dropdown?.classList.toggle("visible");
      return;
    }

    const deleteBtn = event.target.closest(".delete-btn");
    if (deleteBtn) {
      articleIdToDelete = deleteBtn.dataset.id;
      deleteConfirmModal?.classList.add("visible");
      deleteBtn.closest(".options-dropdown")?.classList.remove("visible");
      return;
    }

    const editBtn = event.target.closest(".edit-btn");
    if (editBtn) {
      const articleId = editBtn.dataset.id;
      openEditModal(articleId);
      editBtn.closest(".options-dropdown")?.classList.remove("visible");
      return;
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
      return;
    }

    const favoriteBtn = event.target.closest(".favorite-btn");
    if (favoriteBtn) {
      const articleId = favoriteBtn.dataset.id;
      favoriteBtn.closest(".options-dropdown")?.classList.remove("visible");

      try {
        const result = await toggleFavoriteArticle(articleId);
        showSuccessToast(result.message);

        currentUserFavorites = result.favorites;
        if (currentUserFavorites.includes(articleId)) {
          favoriteBtn.dataset.isFavorite = "true";
          favoriteBtn.innerHTML = `<i class="fas fa-star"></i> Quitar de favoritos`;
        } else {
          favoriteBtn.dataset.isFavorite = "false";
          favoriteBtn.innerHTML = `<i class="far fa-star"></i> Añadir a favoritos`;
        }
      } catch (error) {
        showErrorToast(error.message);
      }
      return;
    }
  });

  editQuestionForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const articleId = document.getElementById("edit-article-id").value;
    const formData = new FormData(event.target);

    const imagesToDelete = [];
    document
      .querySelectorAll(
        '#current-images-preview input[type="hidden"][name="imagesToDelete[]"]'
      )
      .forEach((input) => {
        imagesToDelete.push(input.value);
      });

    if (imagesToDelete.length > 0) {
      imagesToDelete.forEach((url) => formData.append("imagesToDelete", url));
    }

    const newImageInput = document.getElementById("edit-image-files");
    if (newImageInput && newImageInput.files.length === 0) {
      formData.delete("imageFiles");
    }

    try {
      await updateArticle(articleId, formData);
      showSuccessToast("Pregunta actualizada con éxito.");
      editQuestionModal?.classList.remove("visible");
      await initializeArticleFeed(authData.data);
    } catch (error) {
      showErrorToast(`Error al actualizar: ${error.message}`);
      console.error("Error en submit edit:", error);
    }
  });

  editQuestionModal?.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-image-btn")) {
      const urlToRemove = event.target.dataset.url;
      const previewItem = event.target.closest(".image-preview-item");
      if (previewItem) {
        let hiddenInput = previewItem.querySelector(
          `input[value="${urlToRemove}"]`
        );
        if (!hiddenInput) {
          hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          hiddenInput.name = "imagesToDelete[]";
          hiddenInput.value = urlToRemove;
          previewItem.appendChild(hiddenInput);
          previewItem.style.opacity = "0.5";
          event.target.textContent = "+";
          event.target.style.background = "rgba(0,128,0,0.7)";
        } else {
          hiddenInput.remove();
          previewItem.style.opacity = "1";
          event.target.textContent = "×";
          event.target.style.background = "rgba(255,0,0,0.7)";
        }
      }
    } else if (event.target === editQuestionModal) {
      editQuestionModal.classList.remove("visible");
    }
  });

  cancelEditBtn?.addEventListener("click", () => {
    editQuestionModal?.classList.remove("visible");
  });

  closeEditModalBtn?.addEventListener("click", () => {
    editQuestionModal?.classList.remove("visible");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".article-options-menu")) {
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        d.classList.remove("visible");
      });
    }
  });

  confirmDeleteBtn?.addEventListener("click", () => {
    if (articleIdToDelete) {
      handleDeleteArticle(articleIdToDelete)
        .then(async () => {
          articleIdToDelete = null;
          await initializeArticleFeed(authData.data);
        })
        .catch(() => {})
        .finally(() => {
          deleteConfirmModal?.classList.remove("visible");
        });
    }
  });

  cancelDeleteBtn?.addEventListener("click", () => {
    deleteConfirmModal?.classList.remove("visible");
    articleIdToDelete = null;
  });

  deleteConfirmModal?.addEventListener("click", (event) => {
    if (event.target === deleteConfirmModal) {
      deleteConfirmModal.classList.remove("visible");
    }
  });

  initializeLightbox("questions-list");
};

document.addEventListener("DOMContentLoaded", initializeIndexPage);
