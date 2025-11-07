import { verifyAuth, logoutUser } from "./services/auth.service.js";
import { fetchTopContributors } from "./services/user.service.js";
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
import { voteOnArticle, searchArticles } from "./services/article.service.js"; // Importamos searchArticles
import { showSuccessToast, showErrorToast } from "./utils/notifications.js";

const renderContributorItem = (user, rank) => {
  // Lógica de avatar (reutilizada de article.ui.js)
  const defaultAvatarName = user.username || user.profile?.firstName || "NN";
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    defaultAvatarName
  )}&background=random`;
  const avatarUrl = user.profile?.avatarUrl || defaultAvatarUrl;

  return `
    <li class="contributor-item">
      <span class="contributor-rank">#${rank}</span>
      <img src="${avatarUrl}" alt="Avatar de ${
    user.username
  }" class="contributor-avatar" loading="lazy" />
      <div class="contributor-info">
        <a href="/usuario.html?id=${user._id}" class="contributor-name">${
    user.username
  }</a>
        <span class="contributor-likes">
          <i class="fas fa-thumbs-up"></i> ${user.totalLikes} ${
    user.totalLikes === 1 ? "Like" : "Likes"
  }
        </span>
      </div>
    </li>
  `;
};

/**
 * Carga los contribuyentes y los muestra en la barra lateral.
 */
const loadTopContributors = async () => {
  const container = document.querySelector(".contributors-list");
  if (!container) return;

  try {
    const contributors = await fetchTopContributors();

    // Filtrar para excluir usuarios con 0 likes
    const filtered = (contributors || []).filter(
      (u) => (u.totalLikes || 0) > 0
    );

    if (filtered.length === 0) {
      container.innerHTML = "<p>No hay contribuyentes con likes este mes.</p>";
      return;
    }

    // Opcional: ordenar de mayor a menor por likes
    filtered.sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0));

    // Usamos una lista ordenada <ol> para el ranking
    const listHtml = filtered
      .map((user, index) => renderContributorItem(user, index + 1))
      .join("");

    container.innerHTML = `<ol class="contributor-ranked-list">${listHtml}</ol>`;
  } catch (error) {
    console.error("Error al cargar contribuyentes:", error);
    container.innerHTML = "<p>Error al cargar el ranking.</p>";
  }
};

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
  await loadTopContributors();

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

  // LA LÓGICA DE BÚSQUEDA
  const searchBar =
    document.querySelector(".search-bar") ||
    document.getElementById("action-search-bar-wrapper");
  const searchInput = searchBar ? searchBar.querySelector("input") : null;
  const searchButton = searchBar
    ? searchBar.querySelector(".search-button")
    : null;

  if (!searchBar || !searchInput || !searchButton) {
    // No hay barra de búsqueda en esta versión del HTML: evitar errores y salir.
    console.warn(
      "Barra de búsqueda no encontrada en el DOM, se omite la inicialización de búsqueda."
    );
  } else {
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
      if (event.key === "Enter") performSearch();
    });
  }

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

  questionsList.addEventListener("click", async (event) => {
    // --- Lógica para el menú de opciones ---
    const toggleBtn = event.target.closest(".options-toggle-btn");
    if (toggleBtn) {
      const dropdown = toggleBtn.nextElementSibling;
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        if (d !== dropdown) d.classList.remove("visible");
      });
      dropdown.classList.toggle("visible");
    }

    // --- Lógica para el botón de eliminar ---
    const deleteBtn = event.target.closest(".delete-btn");
    if (deleteBtn) {
      articleIdToDelete = deleteBtn.dataset.id;
      deleteConfirmModal.classList.add("visible");
      deleteBtn.closest(".options-dropdown").classList.remove("visible");
    }

    // --- Lógica para los botones de voto ---
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
