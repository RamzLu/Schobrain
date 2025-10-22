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

// Guarda la lista actual de IDs favoritos del usuario
let currentUserFavorites = [];

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
  } catch (error) {
    console.error("Error al inicializar el feed con favoritos:", error);
    showErrorToast(
      "No se pudo cargar la información de favoritos. Mostrando todas las preguntas."
    );
    // Llama a la función original (renombrada como initializeFeed)
    await initializeFeed(currentUser); // Carga sin favoritos si falla
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

  // Llama a la nueva función de inicialización que obtiene favoritos primero
  await initializeArticleFeed(authData.data);

  // --- El resto del código de inicialización (menú, modal, búsqueda, filtros, etc.) ---
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
    fractionBtnId: "fraction-btn", // Asegúrate que estos IDs existan
    exponentBtnId: "exponent-btn",
  });

  const searchBar = document.querySelector(".search-bar");
  const searchInput = searchBar?.querySelector("input");
  const searchButton = searchBar?.querySelector(".search-button");

  const performSearch = async () => {
    if (!searchInput) return;
    const query = searchInput.value.trim();
    if (!query) {
      showErrorToast("Por favor, ingresa un término para buscar.");
      return;
    }
    try {
      const results = await searchArticles(query);
      // Pasa la lista de favoritos al cargar resultados de búsqueda
      loadArticles(results, authData.data, currentUserFavorites);
      showSuccessToast(`${results.length} resultados para "${query}"`);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  searchButton?.addEventListener("click", performSearch);
  searchInput?.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
  });

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
