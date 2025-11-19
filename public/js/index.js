import { verifyAuth, logoutUser } from "./services/auth.service.js";
import {
  showAskQuestionModal,
  setupCancelButton,
  initializeSymbolsPanel,
  loadArticles,
} from "./article/article.ui.js";
import {
  handlePostQuestion,
  initializeArticleFeed as initializeFeed,
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
import { fetchTopContributors } from "./services/user.service.js";

// Estado global
let currentUserFavorites = [];
let allQuestionsCache = [];
let searchHistory = [];
let isSearchFocused = false;
let currentAuthData = null;

const renderAdminMenuOption = () => {
  const userMenu = document.getElementById("user-menu");
  if (userMenu) {
    const adminHtml = `<a href="/admin.html" id="admin-config-button">Configuración de administrador</a>`;
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.insertAdjacentHTML("beforebegin", adminHtml);
    } else {
      userMenu.insertAdjacentHTML("beforeend", adminHtml);
    }
  }
};

// === FUNCIÓN DE PODIO + LISTA TOP 10 ===
const renderContributors = (contributors) => {
  const container = document.querySelector(".contributors-list");
  if (!container) return;

  if (contributors.length === 0) {
    container.innerHTML = "<p class='no-data-podium'>Aún no hay datos.</p>";
    return;
  }

  // --- 1. Renderizar PODIO (Top 3) ---
  const first = contributors[0] || null;
  const second = contributors[1] || null;
  const third = contributors[2] || null;

  const createPodiumItem = (user, rank) => {
    if (!user) return `<div class="podium-step rank-${rank} empty"></div>`;

    const avatarSrc = user.avatarUrl || "assets/img/default-avatar.png";
    const name = `${user.firstName} ${user.lastName}`;
    const likes = user.totalLikes;
    const profileLink = `/usuario.html?id=${user._id}`;

    let medalImageSrc = "";
    let medalAlt = "";

    if (rank === 1) {
      medalImageSrc = "/assets/img/1.png"; // Ruta a tu medalla de oro
      medalAlt = "Medalla de Oro";
    } else if (rank === 2) {
      medalImageSrc = "/assets/img/2.png"; // Ruta a tu medalla de plata
      medalAlt = "Medalla de Plata";
    } else if (rank === 3) {
      medalImageSrc = "/assets/img/3.png"; // Ruta a tu medalla de bronce
      medalAlt = "Medalla de Bronce";
    }

    return `
      <div class="podium-step rank-${rank}">
        <a href="${profileLink}" class="podium-avatar-link" title="Ver perfil de ${name}">
            <div class="podium-avatar-wrapper">
                ${
                  rank === 1
                    ? '<div class="crown-icon"><i class="fas fa-crown"></i></div>'
                    : ""
                }
                <img src="${avatarSrc}" alt="${name}" class="podium-avatar">
                <div class="podium-badge">${rank}</div>
            </div>
        </a>
        <div class="podium-info">
            <a href="${profileLink}" class="podium-name">${name}</a>
            <span class="podium-likes"><i class="fas fa-heart"></i> ${likes}</span>
        </div>
        <div class="podium-block">
            ${
              medalImageSrc
                ? `<img src="${medalImageSrc}" alt="${medalAlt}" class="podium-medal-img">`
                : ""
            }
        </div>
      </div>
    `;
  };

  let htmlContent = `
    <div class="podium-container">
        ${createPodiumItem(second, 2)}
        ${createPodiumItem(first, 1)}
        ${createPodiumItem(third, 3)}
    </div>
  `;

  // --- 2. Renderizar LISTA (Puestos 4 al 10) ---
  const restContributors = contributors.slice(3); // Tomamos del índice 3 en adelante

  if (restContributors.length > 0) {
    const listItems = restContributors
      .map((user, index) => {
        const rank = index + 4; // El ranking empieza en 4
        const avatarSrc = user.avatarUrl || "assets/img/default-avatar.png";
        const name = `${user.firstName} ${user.lastName}`;
        const likes = user.totalLikes;
        const profileLink = `/usuario.html?id=${user._id}`;

        return `
          <a href="${profileLink}" class="contributor-list-item">
            <div class="list-rank">${rank}</div>
            <img src="${avatarSrc}" alt="${name}" class="list-avatar">
            <div class="list-info">
              <span class="list-name">${name}</span>
              <span class="list-likes"><i class="fas fa-heart"></i> ${likes} likes</span>
            </div>
          </a>
        `;
      })
      .join("");

    htmlContent += `
      <div class="contributors-list-container">
        <h3 class="contributors-list-title">Menciones Honoríficas</h3>
        ${listItems}
      </div>
    `;
  }

  container.innerHTML = htmlContent;
};

const initializeArticleFeed = async (currentUser) => {
  try {
    const profileData = await getProfile();
    currentUserFavorites = profileData.favorites || [];
    await initializeFeed(currentUser, currentUserFavorites);
    allQuestionsCache = await fetchAllArticles();
  } catch (error) {
    console.error("Error inicializando feed:", error);
    await initializeFeed(currentUser);
  }
};

// ... (El resto del código de index.js se mantiene igual) ...

const loadSearchHistory = () => {
  const saved = localStorage.getItem("searchHistory");
  if (saved) searchHistory = JSON.parse(saved);
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

  if (!searchWrapper) return;

  loadSearchHistory();
  const debouncedDropdownSearch = debounce(performDropdownSearch, 200);

  searchInput.addEventListener("input", debouncedDropdownSearch);
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
    if (event.key === "Escape") searchInput.blur();
  });
  sendIcon.addEventListener("click", executeMainSearch);
  clearHistoryBtn.addEventListener("click", clearHistory);

  resultsList.addEventListener("click", (event) => {
    const item = event.target.closest(".search-result-item");
    if (item) {
      const articleId = item.dataset.articleId;
      window.location.href = `/pregunta.html?id=${articleId}`;
    }
  });
  historyList.addEventListener("click", (event) => {
    const item = event.target.closest(".history-item-btn");
    if (item) {
      searchInput.value = item.dataset.query;
      isSearchFocused = true;
      performDropdownSearch();
      searchInput.focus();
    }
  });
};

const initializeIndexPage = async () => {
  let authData;
  try {
    authData = await verifyAuth();
    const usernameSpan = document.getElementById("logged-in-username");
    if (usernameSpan && authData && authData.data) {
      usernameSpan.textContent = authData.data.firstName;
      if (authData.data.role === "admin") renderAdminMenuOption();
    }
  } catch (error) {
    window.location.href = "/login.html";
    return;
  }

  await initializeArticleFeed(authData.data);

  // Cargar e inicializar el podio + lista
  fetchTopContributors()
    .then((contributors) => renderContributors(contributors))
    .catch((err) => console.error(err));

  // Menú de usuario
  const menuToggle = document.querySelector(".menu-toggle");
  const userMenu = document.getElementById("user-menu");
  if (menuToggle && userMenu) {
    menuToggle.addEventListener("click", () =>
      userMenu.classList.toggle("visible")
    );
    document.addEventListener("click", (event) => {
      if (
        !menuToggle.contains(event.target) &&
        !userMenu.contains(event.target)
      ) {
        userMenu.classList.remove("visible");
      }
    });
  }

  // Modal Pregunta
  const askQuestionButton = document.getElementById("ask-question-button");
  const askQuestionForm = document.getElementById("askQuestionForm");
  const askQuestionModal = document.getElementById("ask-question-modal");

  if (askQuestionButton)
    askQuestionButton.addEventListener("click", showAskQuestionModal);
  if (askQuestionForm) {
    askQuestionForm.addEventListener("submit", handlePostQuestion);
    setupCancelButton();
    if (askQuestionModal) {
      askQuestionModal.addEventListener("click", (e) => {
        if (e.target === askQuestionModal)
          askQuestionModal.classList.remove("visible");
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

  // Filtros
  const subjectFilterList = document.getElementById("subject-filter-list");
  if (subjectFilterList) {
    subjectFilterList.addEventListener("click", async (event) => {
      event.preventDefault();
      const link = event.target.closest("a");
      if (link && link.dataset.tagName) {
        const tagName = link.dataset.tagName;
        try {
          let articles;
          if (tagName === "all") articles = await fetchAllArticles();
          else articles = await fetchArticlesByTag(tagName);
          loadArticles(articles, authData.data, currentUserFavorites);
        } catch (error) {
          showErrorToast(`Error al filtrar: ${error.message}`);
        }
      }
    });
  }

  // Eventos globales (Delete, Edit, Vote, Fav)
  const questionsList = document.getElementById("questions-list");

  // Listener Delegado Principal
  questionsList?.addEventListener("click", async (event) => {
    // Toggle Menu
    const toggleBtn = event.target.closest(".options-toggle-btn");
    if (toggleBtn) {
      const dropdown = toggleBtn.nextElementSibling;
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        if (d !== dropdown) d.classList.remove("visible");
      });
      dropdown?.classList.toggle("visible");
      return;
    }
    // Delete
    const deleteBtn = event.target.closest(".delete-btn");
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      handleDeleteArticle(id)
        .then(() => initializeArticleFeed(authData.data))
        .catch(() => {});
      return;
    }
    // Vote
    const voteBtn = event.target.closest(".vote-btn");
    if (voteBtn) {
      try {
        const updatedVotes = await voteOnArticle(
          voteBtn.dataset.articleId,
          voteBtn.dataset.voteType
        );
        // Actualizar DOM simple
        const card = voteBtn.closest(".article-card");
        card.querySelector(".like-count").textContent = updatedVotes.likes;
        card.querySelector(".dislike-count").textContent =
          updatedVotes.dislikes;
        // Toggle clases active...
      } catch (e) {
        showErrorToast(e.message);
      }
      return;
    }
    // Favorite
    const favBtn = event.target.closest(".favorite-btn");
    if (favBtn) {
      try {
        const res = await toggleFavoriteArticle(favBtn.dataset.id);
        showSuccessToast(res.message);
        currentUserFavorites = res.favorites;
        // Actualizar texto btn...
      } catch (e) {
        showErrorToast(e.message);
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".article-options-menu")) {
      document
        .querySelectorAll(".options-dropdown.visible")
        .forEach((d) => d.classList.remove("visible"));
    }
  });

  initializeLightbox("questions-list");
};

document.addEventListener("DOMContentLoaded", initializeIndexPage);
