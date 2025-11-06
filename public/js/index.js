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
  filterArticlesByTag as handleFilterArticlesByTag, // Renamed handler function
  handleDeleteArticle,
} from "./article/article.handler.js"; // Ensure handleFilterArticlesByTag is correctly exported if defined here
import { initializeLightbox } from "./utils/lightbox.js";
import {
  voteOnArticle,
  searchArticles,
  fetchArticleById,
  updateArticle,
  toggleFavoriteArticle,
  fetchAllArticles, // Keep this import
  fetchArticlesByTag, // <-- ADD THIS IMPORTATION
} from "./services/article.service.js"; // Import fetchArticlesByTag
import { showSuccessToast, showErrorToast } from "./utils/notifications.js";
import { fetchAllTags } from "./services/tag.service.js";
// Ensure this service exists and exports getProfile correctly
import { getProfile } from "./services/profile.service.js";
// === INICIO DE LA MODIFICACIÓN (Importar debounce) ===
import { debounce } from "./utils/debounce.js";
// === FIN DE LA MODIFICACIÓN ===

// Guarda la lista actual de IDs favoritos del usuario
let currentUserFavorites = [];
// === INICIO DE LA MODIFICACIÓN (Variables para la nueva búsqueda) ===
let allQuestionsCache = []; // Almacena todas las preguntas para filtrar localmente
let searchHistory = [];
let isSearchFocused = false;
let currentAuthData = null; // Almacenará los datos de auth para usarlos en la búsqueda
// === FIN DE LA MODIFICACIÓN ===

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

// NUEVA FUNCIÓN para inicializar el feed con favoritos
const initializeArticleFeed = async (currentUser) => {
  try {
    // Obtener el perfil completo para tener la lista de favoritos actualizada
    const profileData = await getProfile();
    currentUserFavorites = profileData.favorites || []; // Actualiza la variable global
    // Llama a la función original (renombrada como initializeFeed)
    // Asegúrate de que initializeFeed está definido en article.handler.js y exportado
    // Si initializeFeed está en este archivo, simplemente llámalo
    await initializeFeed(currentUser, currentUserFavorites);

    // === INICIO DE LA MODIFICACIÓN (Cachear artículos) ===
    // Asumimos que initializeFeed carga los artículos iniciales, pero
    // para estar seguros, los cargamos aquí para el caché de búsqueda.
    allQuestionsCache = await fetchAllArticles();
    // === FIN DE LA MODIFICACIÓN ===
  } catch (error) {
    console.error("Error al inicializar el feed con favoritos:", error);
    showErrorToast(
      "No se pudo cargar la información de favoritos. Mostrando todas las preguntas."
    );
    // Llama a la función original (renombrada como initializeFeed)
    await initializeFeed(currentUser); // Carga sin favoritos si falla
  }
};

// =================================================================
// === INICIO DE LA MODIFICACIÓN (Lógica de la Nueva Barra de Búsqueda) ===
// =================================================================

/**
 * Carga el historial desde localStorage
 */
const loadSearchHistory = () => {
  const saved = localStorage.getItem("searchHistory");
  if (saved) {
    searchHistory = JSON.parse(saved);
  }
};

/**
 * Guarda el historial en localStorage
 */
const saveSearchHistory = () => {
  localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
};

/**
 * Muestra los items del historial en el panel
 */
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

/**
 * Limpia el historial
 */
const clearHistory = () => {
  searchHistory = [];
  saveSearchHistory();
  renderHistory();
};

/**
 * Devuelve la clase CSS para el color de la asignatura (basado en React)
 */
const getSubjectColorClass = (subjectName) => {
  const subjectColors = {
    Matemáticas: "result-subject-math",
    Biología: "result-subject-biologia",
    Historia: "result-subject-historia",
    Literatura: "result-subject-literatura",
  };
  return subjectColors[subjectName] || "result-subject-default";
};

/**
 * Muestra los resultados filtrados en el panel
 */
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

/**
 * Filtra los artículos cacheados y muestra resultados o historial
 */
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
    renderHistory(); // Muestra el historial si no hay query
    return;
  }

  historySection.style.display = "none"; // Oculta el historial si hay query
  resultsList.style.display = "block";

  const filteredQuestions = allQuestionsCache.filter((question) => {
    const subject = question.tags?.[0]?.name || "";
    const searchableText =
      `${question.content} ${subject} ${question.author?.username}`.toLowerCase();
    return searchableText.includes(query);
  });

  renderResults(filteredQuestions);
};

/**
 * Ejecuta la búsqueda principal (actualiza el feed de artículos)
 */
const executeMainSearch = async () => {
  const searchInput = document.getElementById("action-search-input");
  if (!searchInput) return;

  const query = searchInput.value.trim();
  if (!query) {
    showErrorToast("Por favor, ingresa un término para buscar.");
    return;
  }

  // Añadir al historial
  searchHistory = [
    query,
    ...searchHistory.filter((item) => item !== query),
  ].slice(0, 5); // Limita a 5
  saveSearchHistory();

  try {
    const results = await searchArticles(query); // API call
    loadArticles(results, currentAuthData, currentUserFavorites); // Renders main feed
    showSuccessToast(`${results.length} resultados para "${query}"`);
    searchInput.blur(); // Cierra el panel
  } catch (error) {
    showErrorToast(error.message);
  }
};

/**
 * Cambia el icono de la barra de búsqueda
 */
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

/**
 * Inicializa todos los listeners para la barra de búsqueda
 */
const initializeActionSearchBar = (authData) => {
  currentAuthData = authData; // Guarda los datos de auth
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
    performDropdownSearch(); // Muestra historial o resultados
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (isSearchFocused) {
        isSearchFocused = false;
        searchPanel.classList.remove("visible");
      }
    }, 200); // Delay para permitir clics en el panel
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

  // Clic en un item de resultado
  resultsList.addEventListener("click", (event) => {
    const item = event.target.closest(".search-result-item");
    if (item) {
      const articleId = item.dataset.articleId;
      const question = allQuestionsCache.find((q) => q._id === articleId);
      if (question) {
        // Añadir al historial
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
      // Redirigir a la página de la pregunta
      window.location.href = `/pregunta.html?id=${articleId}`;
    }
  });

  // Clic en un item de historial
  historyList.addEventListener("click", (event) => {
    const item = event.target.closest(".history-item-btn");
    if (item) {
      const query = item.dataset.query;
      searchInput.value = query;
      isSearchFocused = true;
      performDropdownSearch();
      searchInput.focus(); // Mantener el foco
    }
  });
};
// =================================================================
// === FIN DE LA MODIFICACIÓN (Lógica de la Nueva Barra de Búsqueda) ===
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

  // Llama a la nueva función de inicialización que obtiene favoritos primero
  await initializeArticleFeed(authData.data);

  // --- El resto del código de inicialización (menú, modal, filtros, etc.) ---
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

  // === INICIO DE LA MODIFICACIÓN (Inicializar nueva búsqueda) ===
  // Eliminar la lógica de búsqueda antigua
  /*
  const searchBar = document.querySelector(".search-bar"); // ELIMINADO
  const searchInput = searchBar?.querySelector("input"); // ELIMINADO
  const searchButton = searchBar?.querySelector(".search-button"); // ELIMINADO
  const performSearch = async () => { ... }; // ELIMINADO
  searchButton?.addEventListener("click", performSearch); // ELIMINADO
  searchInput?.addEventListener("keypress", (event) => { ... }); // ELIMINADO
  */

  // Añadir inicializador de la nueva barra
  initializeActionSearchBar(authData.data);
  // === FIN DE LA MODIFICACIÓN ===

  const subjectFilterList = document.getElementById("subject-filter-list");
  if (subjectFilterList) {
    // CORRECCIÓN: Asegúrate que fetchAllArticles está importado y se usa aquí
    subjectFilterList.addEventListener("click", async (event) => {
      event.preventDefault();
      const link = event.target.closest("a");
      if (link && link.dataset.tagName) {
        const tagName = link.dataset.tagName;
        try {
          let articles;
          if (tagName === "all") {
            articles = await fetchAllArticles(); // <-- USA LA FUNCIÓN IMPORTADA
          } else {
            // <-- USA LA FUNCIÓN IMPORTADA CORRECTAMENTE
            articles = await fetchArticlesByTag(tagName);
          }
          // Pasa la lista de favoritos al cargar resultados de filtro
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
      tagSelect.innerHTML = ""; // Limpiar opciones anteriores
      tags.forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag._id;
        option.textContent = tag.name;
        // Seleccionar el tag actual del artículo
        if (
          article.tags &&
          article.tags[0] &&
          tag._id === article.tags[0]._id
        ) {
          option.selected = true;
        }
        tagSelect.appendChild(option);
      });

      // Lógica para mostrar imágenes actuales y permitir eliminar
      const currentImagesPreview = document.getElementById(
        "current-images-preview"
      );
      if (currentImagesPreview) {
        currentImagesPreview.innerHTML = ""; // Limpiar
        if (article.imageUrls && article.imageUrls.length > 0) {
          article.imageUrls.forEach((url) => {
            const imgContainer = document.createElement("div");
            // Estilo básico para el contenedor de imagen y botón
            imgContainer.style.position = "relative";
            imgContainer.style.display = "inline-block";
            imgContainer.style.margin = "5px";
            imgContainer.classList.add("image-preview-item"); // Clase para identificarlo

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

      // Limpiar input de nuevos archivos
      const editFileInput = document.getElementById("edit-image-files");
      const editFileNameDisplay = document.getElementById(
        "edit-file-name-display"
      );
      if (editFileInput) editFileInput.value = "";
      if (editFileNameDisplay)
        editFileNameDisplay.textContent = "Ningún archivo seleccionado";

      editQuestionModal.classList.add("visible");

      // Inicializar el panel de símbolos después de mostrar el modal.
      initializeSymbolsPanel({
        textareaId: "edit-question-content",
        toggleBtnId: "edit-toggle-symbols-btn",
        panelId: "edit-math-symbols-panel",
        includeFunctions: true,
      });
      // FIN FIX
    } catch (error) {
      showErrorToast("Error al cargar los datos de la pregunta para editar.");
      console.error("Error en openEditModal:", error);
    }
  };

  questionsList?.addEventListener("click", async (event) => {
    // --- Lógica Menú Desplegable ---
    const toggleBtn = event.target.closest(".options-toggle-btn");
    if (toggleBtn) {
      const dropdown = toggleBtn.nextElementSibling;
      // Cerrar otros dropdowns abiertos
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        if (d !== dropdown) d.classList.remove("visible");
      });
      dropdown?.classList.toggle("visible");
      return; // Evita que otros listeners se activen accidentalmente
    }

    // --- Lógica Botón Eliminar ---
    const deleteBtn = event.target.closest(".delete-btn");
    if (deleteBtn) {
      articleIdToDelete = deleteBtn.dataset.id;
      deleteConfirmModal?.classList.add("visible");
      deleteBtn.closest(".options-dropdown")?.classList.remove("visible"); // Cierra el dropdown
      return;
    }

    // --- Lógica Botón Editar ---
    const editBtn = event.target.closest(".edit-btn");
    if (editBtn) {
      const articleId = editBtn.dataset.id;
      openEditModal(articleId);
      editBtn.closest(".options-dropdown")?.classList.remove("visible"); // Cierra el dropdown
      return;
    }

    // --- Lógica Botón Votar ---
    const voteBtn = event.target.closest(".vote-btn");
    if (voteBtn) {
      const articleId = voteBtn.dataset.articleId;
      const voteType = voteBtn.dataset.voteType;

      try {
        const updatedVotes = await voteOnArticle(articleId, voteType);
        // Actualizar UI del voto
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

    // --- NUEVA LÓGICA BOTÓN FAVORITOS ---
    const favoriteBtn = event.target.closest(".favorite-btn");
    if (favoriteBtn) {
      const articleId = favoriteBtn.dataset.id;
      const isCurrentlyFavorite = favoriteBtn.dataset.isFavorite === "true";
      favoriteBtn.closest(".options-dropdown")?.classList.remove("visible"); // Cierra dropdown

      try {
        const result = await toggleFavoriteArticle(articleId);
        showSuccessToast(result.message);

        // Actualizar estado global y UI
        currentUserFavorites = result.favorites; // Actualiza la lista global
        const icon = favoriteBtn.querySelector("i");
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

    // Recolectar URLs de imágenes marcadas para eliminar
    const imagesToDelete = [];
    document
      .querySelectorAll(
        '#current-images-preview input[type="hidden"][name="imagesToDelete[]"]'
      )
      .forEach((input) => {
        imagesToDelete.push(input.value);
      });

    // Añadir las URLs al FormData si hay alguna
    if (imagesToDelete.length > 0) {
      imagesToDelete.forEach((url) => formData.append("imagesToDelete", url));
    }

    // Limpiar el campo de archivos nuevos si no se seleccionó nada nuevo,
    // para evitar enviar un array vacío accidentalmente si el backend lo interpreta mal.
    const newImageInput = document.getElementById("edit-image-files");
    if (newImageInput && newImageInput.files.length === 0) {
      formData.delete("imageFiles");
    }

    try {
      await updateArticle(articleId, formData);
      showSuccessToast("Pregunta actualizada con éxito.");
      editQuestionModal?.classList.remove("visible");
      // Recargar el feed después de editar
      await initializeArticleFeed(authData.data);
    } catch (error) {
      showErrorToast(`Error al actualizar: ${error.message}`);
      console.error("Error en submit edit:", error);
    }
  });

  // Listener para botones de eliminar imagen en modal de edición
  editQuestionModal?.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-image-btn")) {
      const urlToRemove = event.target.dataset.url;
      const previewItem = event.target.closest(".image-preview-item");
      if (previewItem) {
        // Verifica si ya existe un input oculto para esta imagen
        let hiddenInput = previewItem.querySelector(
          `input[value="${urlToRemove}"]`
        );
        if (!hiddenInput) {
          // Si no existe, lo crea
          hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          hiddenInput.name = "imagesToDelete[]"; // Nombre correcto para el backend
          hiddenInput.value = urlToRemove;
          previewItem.appendChild(hiddenInput);
          // Oculta visualmente o añade clase para indicar eliminación
          previewItem.style.opacity = "0.5";
          event.target.textContent = "+"; // Cambia botón para indicar "deshacer" (opcional)
          event.target.style.background = "rgba(0,128,0,0.7)"; // Verde
        } else {
          // Si ya existe (se marcó para eliminar), lo quita para "deshacer"
          hiddenInput.remove();
          previewItem.style.opacity = "1";
          event.target.textContent = "×";
          event.target.style.background = "rgba(255,0,0,0.7)"; // Rojo
        }
      }
    }
    // Cerrar modal si se hace clic fuera del contenido
    else if (event.target === editQuestionModal) {
      editQuestionModal.classList.remove("visible");
    }
  });

  cancelEditBtn?.addEventListener("click", () => {
    editQuestionModal?.classList.remove("visible");
  });

  // Listener para el botón 'X'
  closeEditModalBtn?.addEventListener("click", () => {
    editQuestionModal?.classList.remove("visible");
  });

  // Cerrar dropdowns al hacer clic fuera
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".article-options-menu")) {
      document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
        d.classList.remove("visible");
      });
    }
  });

  // --- Lógica Modal Confirmar Eliminación ---
  confirmDeleteBtn?.addEventListener("click", () => {
    if (articleIdToDelete) {
      handleDeleteArticle(articleIdToDelete) // Llama al handler existente
        .then(async () => {
          articleIdToDelete = null; // Resetea después de éxito
          // Opcional: Recargar el feed para que desaparezca inmediatamente
          await initializeArticleFeed(authData.data);
        })
        .catch(() => {
          // El handler ya muestra el error
        })
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

  // --- Inicialización Lightbox ---
  initializeLightbox("questions-list"); // ID del contenedor de preguntas
};

document.addEventListener("DOMContentLoaded", initializeIndexPage);
