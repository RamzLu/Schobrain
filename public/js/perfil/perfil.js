// public/js/perfil/perfil.js
import {
  verifyAuth,
  logoutUser,
  deleteAccount,
} from "../services/auth.service.js";
import {
  getProfile,
  updateProfileData,
  updateAccountData,
  updateAvatarImage,
  getFavoriteArticles,
  getFavoriteComments,
  toggleFavoriteComment,
} from "../services/profile.service.js";
import {
  getMyArticles,
  deleteArticle,
  voteOnArticle,
  toggleFavoriteArticle,
  fetchArticleById,
  updateArticle,
} from "../services/article.service.js";
import { getMyComments, deleteComment } from "../services/comment.service.js";
import { showSuccessToast, showErrorToast } from "../utils/notifications.js";
import {
  renderArticleCard,
  initializeSymbolsPanel,
} from "../article/article.ui.js";
import { initializeLightbox } from "../utils/lightbox.js";
import { fetchAllTags } from "../services/tag.service.js";

// Helper para el formato de tiempo (necesario para el renderizado del comentario)
const formatRelativeTime = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const secondsElapsed = Math.floor((now - past) / 1000);

  if (secondsElapsed < 60) return "hace un momento";
  const minutesElapsed = Math.floor(secondsElapsed / 60);
  if (minutesElapsed < 60)
    return `hace ${minutesElapsed} minuto${minutesElapsed > 1 ? "s" : ""}`;
  const hoursElapsed = Math.floor(minutesElapsed / 60);
  if (hoursElapsed < 24)
    return `hace ${hoursElapsed} hora${hoursElapsed > 1 ? "s" : ""}`;
  const daysElapsed = Math.floor(hoursElapsed / 24);
  if (daysElapsed < 7)
    return `hace ${daysElapsed} día${daysElapsed > 1 ? "s" : ""}`;
  const weeksElapsed = Math.floor(daysElapsed / 7);
  if (weeksElapsed < 4)
    return `hace ${weeksElapsed} semana${weeksElapsed > 1 ? "s" : ""}`;
  const monthsElapsed = Math.floor(daysElapsed / 30);
  if (monthsElapsed < 12)
    return `hace ${monthsElapsed} mes${monthsElapsed > 1 ? "es" : ""}`;
  const yearsElapsed = Math.floor(daysElapsed / 365);
  return `hace ${yearsElapsed} año${yearsElapsed > 1 ? "s" : ""}`;
};

// FUNCIÓN para renderizar una tarjeta de comentario favorito
const renderFavoriteCommentCard = (comment) => {
  // FIX 1: Usar username en lugar de nombre y apellido
  const authorName = comment.author.username || "Usuario Desconocido";

  // FIX 2: Construir HTML del avatar
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    comment.author.username || "NN"
  )}&background=random`;
  const avatarUrl = comment.author.profile?.avatarUrl || defaultAvatarUrl;
  const avatarHtml = `<img src="${avatarUrl}" alt="Avatar" class="author-avatar comment-avatar" loading="lazy"/>`;
  // FIN FIX 2

  // El backend de favoritos popula article.content
  const articleContentSnippet =
    comment.article.content.substring(0, 80) + "...";
  const relativeTime = formatRelativeTime(comment.createdAt);

  return `
    <div class="comment-favorite-card" data-id="${comment._id}">
      <div class="comment-header">
        <div class="comment-author-info">
          ${avatarHtml}
          <div class="author-text-group">
              <span class="comment-author">${authorName}</span>
              <span class="comment-date">Respuesta publicada ${relativeTime}</span>
          </div>
        </div>
        <button 
            class="favorite-remove-btn" 
            data-comment-id="${comment._id}" 
            title="Quitar de favoritos"
        >
            <i class="fas fa-star"></i>
        </button>
      </div>
      <div class="comment-content">
        <p>${comment.content}</p>
      </div>
      <div class="comment-metadata">
        <span>Respuesta a la pregunta: </span>
        <a href="/pregunta.html?id=${comment.article._id}" class="metadata-link" title="${comment.article.content}">
            ${articleContentSnippet}
        </a>
      </div>
    </div>
  `;
};

// NUEVA FUNCIÓN para renderizar una tarjeta de comentario propio (TAREA 1)
const renderMyCommentCard = (comment) => {
  // Aquí no tenemos los datos del autor (nosotros mismos) ni del artículo populados
  const relativeTime = formatRelativeTime(comment.createdAt);
  const articleLink = `/pregunta.html?id=${comment.article}`;

  return `
    <div class="comment-favorite-card my-comment-card" data-id="${comment._id}">
      <div class="comment-header">
        <div class="comment-author-info">
          <div class="author-text-group">
              <span class="comment-author">Tu Respuesta</span>
              <span class="comment-date">Publicada ${relativeTime}</span>
          </div>
        </div>
        <button 
            class="delete-my-comment-icon" 
            data-comment-id="${comment._id}" 
            title="Eliminar respuesta"
        >
            <i class="fas fa-trash-alt"></i>
        </button>
      </div>
      <div class="comment-content">
        <p>${comment.content}</p>
      </div>
      <div class="comment-metadata">
        <i class="fas fa-link"></i>
        <a href="${articleLink}" class="metadata-link">
            Ver pregunta original
        </a>
      </div>
    </div>
  `;
};

// --- Variables y Funciones para el Modal de Edición ---
const editQuestionModal = document.getElementById("edit-question-modal");
const editQuestionForm = document.getElementById("editQuestionForm");
const editFileInput = document.getElementById("edit-image-files");
const editFileNameDisplay = document.getElementById("edit-file-name-display");

const openEditModal = async (articleId) => {
  if (!editQuestionModal) return;

  try {
    const article = await fetchArticleById(articleId);
    document.getElementById("edit-article-id").value = article._id;
    document.getElementById("edit-question-content").value = article.content;

    // 1. Cargar y seleccionar Tags
    const tagSelect = document.getElementById("edit-tag-select");
    const tags = await fetchAllTags();
    tagSelect.innerHTML = ""; // Limpiar opciones anteriores
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag._id;
      option.textContent = tag.name;
      // Seleccionar el tag actual del artículo
      if (article.tags && article.tags[0] && tag._id === article.tags[0]._id) {
        option.selected = true;
      }
      tagSelect.appendChild(option);
    });

    // 2. Lógica para mostrar imágenes actuales y permitir eliminar
    const currentImagesPreview = document.getElementById(
      "current-images-preview"
    );
    if (currentImagesPreview) {
      currentImagesPreview.innerHTML = ""; // Limpiar
      if (article.imageUrls && article.imageUrls.length > 0) {
        article.imageUrls.forEach((url) => {
          const imgContainer = document.createElement("div");
          // Estilo básico para el contenedor de imagen y botón (usando estilo en línea como fallback)
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

    // 3. Limpiar input de nuevos archivos
    if (editFileInput) editFileInput.value = "";
    if (editFileNameDisplay)
      editFileNameDisplay.textContent = "Ningún archivo seleccionado";

    editQuestionModal.classList.add("visible");

    // Inicializar panel de símbolos para el modal de edición
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

const handleEditFormSubmit = async (event) => {
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

  // Limpiar el campo de archivos nuevos si no se seleccionó nada nuevo
  if (editFileInput && editFileInput.files.length === 0) {
    formData.delete("imageFiles");
  }

  try {
    const result = await updateArticle(articleId, formData);
    showSuccessToast("Pregunta actualizada con éxito.");
    editQuestionModal?.classList.remove("visible");

    // Recargar la página para ver los cambios actualizados en el perfil
    setTimeout(() => {
      window.location.reload();
    }, 900);
  } catch (error) {
    showErrorToast(`Error al actualizar: ${error.message}`);
    console.error("Error en submit edit:", error);
  }
};

const setupEditModalListeners = (currentUser) => {
  const cancelEditBtn = document.getElementById("cancel-edit-question");
  const closeEditModalBtn = document.getElementById("close-edit-modal");

  // Manejo de archivos en modal de edición
  if (editFileInput && editFileNameDisplay) {
    editFileInput.addEventListener("change", (event) => {
      const { files } = event.target;
      if (!files || files.length === 0) {
        editFileNameDisplay.textContent = "Ningún archivo seleccionado";
      } else if (files.length === 1) {
        editFileNameDisplay.textContent = files[0].name;
      } else {
        editFileNameDisplay.textContent = `${files.length} archivos seleccionados`;
      }
    });
  }

  // Listener para botones de eliminar imagen en modal de edición (delegación)
  document
    .getElementById("current-images-preview")
    ?.addEventListener("click", (event) => {
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
      }
    });

  // Cierre del modal
  cancelEditBtn?.addEventListener("click", () => {
    editQuestionModal?.classList.remove("visible");
  });
  closeEditModalBtn?.addEventListener("click", () => {
    editQuestionModal?.classList.remove("visible");
  });
  editQuestionModal?.addEventListener("click", (event) => {
    if (event.target === editQuestionModal) {
      editQuestionModal.classList.remove("visible");
    }
  });

  // Manejo del formulario
  editQuestionForm?.addEventListener("submit", handleEditFormSubmit);
};

// Variable para almacenar el estado del filtro de contenido
let currentMyContentType = "my-articles";

// NUEVA FUNCIÓN: Establecer los contadores en el DOM
const setProfileStats = (articleCount, commentCount) => {
  const articleDisplay = document.getElementById("article-count-display");
  const commentDisplay = document.getElementById("comment-count-display");
  if (articleDisplay) articleDisplay.textContent = articleCount;
  if (commentDisplay) commentDisplay.textContent = commentCount;
};

// NUEVA FUNCIÓN: Cargar y calcular los contadores del perfil
const loadProfileStats = async () => {
  try {
    // Usamos los mismos servicios que obtienen el contenido propio
    const articles = await getMyArticles();
    const comments = await getMyComments();

    setProfileStats(articles.length, comments.length);
  } catch (error) {
    console.error("Error al cargar los contadores de actividad:", error);
    setProfileStats(0, 0); // Muestra 0 en caso de error
  }
};

// FUNCIÓN PRINCIPAL para cargar y mostrar el contenido propio
const loadMyContent = async (
  filterType = currentMyContentType,
  currentUser
) => {
  const contentListContainer = document.getElementById("my-content-list");
  if (!contentListContainer) return;

  contentListContainer.innerHTML = "<p>Cargando tu contenido...</p>";

  // Actualizar el estado visual del filtro
  const filterButtons = document.querySelectorAll(
    "#my-content-section .favorites-filter-btn"
  );
  filterButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.filterType === filterType) {
      btn.classList.add("active");
    }
  });

  currentMyContentType = filterType; // Actualiza el estado

  try {
    let items = [];
    let emptyMessage = "";
    const userFavorites = currentUser.favorites || []; // Necesario para renderArticleCard

    if (filterType === "my-articles") {
      const response = await getMyArticles();
      items = response;
      emptyMessage = "Aún no has publicado ninguna pregunta.";

      // Renderizar artículos.
      const contentHtml = items
        .map(
          (article) =>
            // === INICIO DE LA MODIFICACIÓN ===
            // Pasamos un objeto de opciones para indicar que es la vista "Mi Contenido"
            renderArticleCard(article, currentUser, userFavorites, {
              isMyContent: true,
            })
          // === FIN DE LA MODIFICACIÓN ===
        )
        .join("");

      contentListContainer.innerHTML = contentHtml;
      initializeLightbox("my-content-list");
    } else if (filterType === "my-comments") {
      const response = await getMyComments();
      items = response;
      emptyMessage = "Aún no has publicado ninguna respuesta.";

      const contentHtml = items.map(renderMyCommentCard).join("");

      contentListContainer.innerHTML = contentHtml;
    }

    if (items.length === 0) {
      contentListContainer.innerHTML = `<p>${emptyMessage}</p>`;
    }
  } catch (error) {
    console.error(`Error al cargar ${filterType}:`, error);
    showErrorToast(`Error al cargar tu contenido: ${error.message}`);
    contentListContainer.innerHTML =
      "<p>Ocurrió un error al cargar tu contenido.</p>";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  let currentUser;
  let fullProfileData = null; // Almacenará favorites y favoriteComments
  let currentFilterType = "articles"; // Estado inicial del filtro: preguntas

  try {
    const authData = await verifyAuth();
    // Aseguramos que currentUser contenga la info necesaria para renderArticleCard
    currentUser = authData.data;
    document.getElementById("logged-in-username").textContent =
      currentUser.firstName;
  } catch (error) {
    window.location.href = "/login.html";
    return;
  }

  // --- Elementos Comunes ---
  const logoutBtnPerfil = document.getElementById("logout-btn-perfil");
  const logoutModal = document.getElementById("logout-modal");
  const cancelLogoutBtn = document.getElementById("cancel-logout");
  const confirmLogoutBtn = document.getElementById("confirm-logout");
  const navLinks = document.querySelectorAll(".profile-nav .nav-link");

  // --- Elementos de Perfil (RESTAURADO) ---
  const profileSection = document.getElementById("profile-section");
  const profileOptionsMenu = profileSection?.querySelector(
    ".profile-options-menu"
  );
  const profileOptionsToggleBtn = profileOptionsMenu?.querySelector(
    ".options-toggle-btn"
  );
  const profileOptionsDropdown =
    profileOptionsMenu?.querySelector(".profile-dropdown");
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const profileModal = document.getElementById("edit-profile-modal");
  const cancelProfileBtn = document.getElementById("cancel-edit-btn");
  const editProfileForm = document.getElementById("edit-profile-form");
  const avatarWrapper = document.getElementById("avatar-wrapper");
  const avatarInput = document.getElementById("avatar-input");
  const avatarDisplay = document.getElementById("avatarUrl");

  // --- Elementos de Cuenta (RESTAURADO) ---
  const accountSection = document.getElementById("account-section");
  const accountOptionsMenu = accountSection?.querySelector(
    ".account-options-menu"
  );
  const accountOptionsToggleBtn = accountOptionsMenu?.querySelector(
    ".account-options-toggle"
  );
  const accountOptionsDropdown =
    accountOptionsMenu?.querySelector(".account-dropdown");
  const editAccountBtn = document.getElementById("edit-account-btn");
  const accountModal = document.getElementById("edit-account-modal");
  const cancelAccountBtn = document.getElementById("cancel-edit-account-btn");
  const editAccountForm = document.getElementById("edit-account-form");

  // --- Elementos de Zona de Peligro ---
  const deleteAccountBtn = document.getElementById("delete-account-btn");
  const deleteAccountModal = document.getElementById("delete-account-modal");
  const cancelDeleteAccountBtn = document.getElementById(
    "cancel-delete-account-btn"
  );
  const confirmDeleteAccountBtn = document.getElementById(
    "confirm-delete-account-btn"
  );
  const deleteConfirmPasswordInput = document.getElementById(
    "delete-confirm-password"
  );

  // --- Elementos de Mi Contenido ---
  const myContentListContainer = document.getElementById("my-content-list");
  const myContentFilterButtons = document.querySelectorAll(
    "#my-content-section .favorites-filter-btn"
  );

  // --- Elementos de Favoritos ---
  const favoritesListContainer = document.getElementById("favorites-list");
  const filterButtons = document.querySelectorAll(
    "#favorites-section .favorites-filter-btn"
  );

  // --- Elementos del nuevo modal de confirmación de comentario ---
  const deleteCommentConfirmModal = document.getElementById(
    "delete-comment-confirm-modal"
  );
  const confirmCommentDeleteBtn = document.getElementById(
    "confirm-comment-delete"
  );
  const cancelCommentDeleteBtn = document.getElementById(
    "cancel-comment-delete"
  );
  let commentIdToDelete = null;

  // --- Funciones de utilidad para menús ---
  const closeAllDropdowns = () => {
    document
      .querySelectorAll(".options-dropdown.visible")
      .forEach((d) => d.classList.remove("visible"));
  };

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      fullProfileData = data;
      // Se necesita la lógica de setProfileFields aquí
      const { profile, email, username, role } = data;
      document.getElementById("firstName").textContent =
        profile.firstName || "Nombre";
      document.getElementById("lastName").textContent =
        profile.lastName || "Apellido";
      document.getElementById("username").textContent = `@${
        username || "username"
      }`;
      document.getElementById("role").textContent = role || "Usuario";
      document.getElementById("biography-display").textContent =
        profile.biography || "No has añadido una biografía.";
      const birthDate = profile.birthDate
        ? new Date(profile.birthDate + "T00:00:00")
        : null;
      document.getElementById("birthdate-display").textContent = birthDate
        ? birthDate.toLocaleDateString("es-ES", { timeZone: "UTC" })
        : "No especificada.";
      document.getElementById("email-display").textContent = email || "";

      // Asumiendo que el elemento del avatar existe
      const avatarDisplay = document.getElementById("avatarUrl");
      avatarDisplay.src =
        profile.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          profile.firstName || "NN"
        )}+${encodeURIComponent(profile.lastName || "")}&background=random`;

      // Asegura que currentUser tiene los favoritos actualizados
      currentUser.favorites = data.favorites || [];
      currentUser.favoriteComments = data.favoriteComments || [];
    } catch (err) {
      showErrorToast(`Error al cargar datos: ${err.message}`);
    }
  };

  // FUNCIÓN PRINCIPAL para cargar y mostrar favoritos (adaptada)
  const loadFavorites = async (filterType = currentFilterType) => {
    if (!favoritesListContainer) return;
    favoritesListContainer.innerHTML = "<p>Cargando favoritos...</p>";

    // Actualizar el estado visual del filtro
    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.filterType === filterType) {
        btn.classList.add("active");
      }
    });

    currentFilterType = filterType; // Actualiza el estado

    try {
      let items = [];
      let emptyMessage = "";

      if (filterType === "articles") {
        items = await getFavoriteArticles();
        emptyMessage = "Aún no has añadido ninguna pregunta a favoritos.";
      } else if (filterType === "comments") {
        items = await getFavoriteComments();
        emptyMessage = "Aún no has añadido ninguna respuesta a favoritos.";
      }

      if (items.length === 0) {
        favoritesListContainer.innerHTML = `<p>${emptyMessage}</p>`;
        return;
      }

      let contentHtml = "";

      const articleFavorites = fullProfileData?.favorites || [];

      if (filterType === "articles") {
        const articlesToRender = items.map((article) => ({
          ...article,
          isFavoriteCard: true,
        }));

        contentHtml = articlesToRender
          .map((article) =>
            renderArticleCard(article, currentUser, articleFavorites)
          )
          .join("");
        favoritesListContainer.innerHTML = contentHtml;
        initializeLightbox("favorites-list");
      } else if (filterType === "comments") {
        contentHtml = items
          .map((comment) => renderFavoriteCommentCard(comment))
          .join("");
        favoritesListContainer.innerHTML = contentHtml;
      }
    } catch (error) {
      console.error(`Error al cargar ${filterType} favoritos:`, error);
      showErrorToast(`Error al cargar favoritos: ${error.message}`);
      favoritesListContainer.innerHTML =
        "<p>Ocurrió un error al cargar tus favoritos.</p>";
    }
  };

  // Función para cambiar la sección visible
  const switchSection = (sectionId) => {
    document.querySelectorAll(".profile-content").forEach((section) => {
      section.classList.remove("active-section");
    });
    const sectionToShow = document.getElementById(`${sectionId}-section`);
    if (sectionToShow) {
      sectionToShow.classList.add("active-section");
    }
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.section === sectionId);
    });

    // Lógica para cargar contenido basado en la sección

    // *** INICIO DE LA MODIFICACIÓN ***
    // Si la sección es "profile", cargamos "Mi Contenido"
    if (sectionId === "profile") {
      document
        .getElementById("filter-my-articles-btn")
        ?.classList.toggle("active", currentMyContentType === "my-articles");
      document
        .getElementById("filter-my-comments-btn")
        ?.classList.toggle("active", currentMyContentType === "my-comments");
      loadMyContent(currentMyContentType, currentUser);
    } else if (sectionId === "favorites") {
      // La lógica de favoritos permanece igual
      document
        .getElementById("filter-articles-btn")
        ?.classList.toggle("active", currentFilterType === "articles");
      document
        .getElementById("filter-comments-btn")
        ?.classList.toggle("active", currentFilterType === "comments");
      loadFavorites(currentFilterType);
    }
    // El "else if" para "my-content" se ha eliminado
    // *** FIN DE LA MODIFICACIÓN ***
  };

  // --- Event Listeners ---

  // Navegación entre secciones
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = e.target.closest("a").dataset.section;
      switchSection(section);
    });
  });

  // Listener para los nuevos botones de filtro de FAVORITOS
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const filterType = btn.dataset.filterType;
      loadFavorites(filterType);
    });
  });

  // Listener para los nuevos botones de filtro de MI CONTENIDO
  myContentFilterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const filterType = btn.dataset.filterType;
      loadMyContent(filterType, currentUser);
    });
  });

  // Listener para quitar favoritos (artículos y comentarios) desde la vista de favoritos
  favoritesListContainer.addEventListener("click", async (event) => {
    const removeCommentBtn = event.target.closest(".favorite-remove-btn");
    const removeArticleStar = event.target.closest(".favorite-remove-star");

    if (!removeCommentBtn && !removeArticleStar) return;

    if (removeCommentBtn && currentFilterType === "comments") {
      const commentId = removeCommentBtn.dataset.commentId;
      try {
        const result = await toggleFavoriteComment(commentId);
        showSuccessToast(result.message);
        if (fullProfileData) {
          fullProfileData.favoriteComments = result.favoriteComments;
        }
        await loadFavorites("comments");
      } catch (error) {
        showErrorToast(error.message);
      }
    } else if (removeArticleStar && currentFilterType === "articles") {
      const articleId = removeArticleStar.dataset.articleId;
      try {
        const result = await toggleFavoriteArticle(articleId);
        showSuccessToast(result.message);
        if (fullProfileData) {
          fullProfileData.favorites = result.favorites;
        }
        await loadFavorites("articles");
      } catch (error) {
        showErrorToast(error.message);
      }
    }

    const link = event.target.closest(".article-image-link");
    if (link && currentFilterType === "articles") {
      const modal = document.getElementById("image-preview-modal");
      const previewImage = document.getElementById("preview-image-src");
      if (modal && previewImage) {
        event.preventDefault();
        previewImage.src = link.href;
        modal.classList.add("visible");
      }
    }
  });

  // TAREA: Listener para la funcionalidad completa de la tarjeta de artículo en MI CONTENIDO
  myContentListContainer.addEventListener("click", async (event) => {
    // --- Funciones de utilidad para menús ---
    const closeAllDropdowns = () => {
      document
        .querySelectorAll(".options-dropdown.visible")
        .forEach((d) => d.classList.remove("visible"));
    };

    // 1. Lógica para el menú de opciones (3 puntitos)
    const toggleBtn = event.target.closest(".options-toggle-btn");
    if (toggleBtn && currentMyContentType === "my-articles") {
      const dropdown = toggleBtn.nextElementSibling;
      closeAllDropdowns(); // Cerrar todos antes de abrir uno
      dropdown.classList.toggle("visible");
      return;
    }

    // 2. Lógica para Votar (Likes/Dislikes) - SOLO ARTÍCULOS
    const voteBtn = event.target.closest(".vote-btn");
    if (voteBtn && currentMyContentType === "my-articles") {
      const articleId = voteBtn.dataset.articleId;
      const voteType = voteBtn.dataset.voteType;

      try {
        const updatedVotes = await voteOnArticle(articleId, voteType); // Servicio de article.service.js

        const articleCard = myContentListContainer.querySelector(
          `.article-card[data-id="${articleId}"]`
        );
        if (articleCard) {
          articleCard.querySelector(".like-count").textContent =
            updatedVotes.likes;
          articleCard.querySelector(".dislike-count").textContent =
            updatedVotes.dislikes;

          const likeBtn = articleCard.querySelector(".vote-btn.like");
          const dislikeBtn = articleCard.querySelector(".vote-btn.dislike");
          const userId = currentUser.id;

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

    // 3. Lógica para Favorito (Botón en Menú) - SOLO ARTÍCULOS
    const favoriteBtn = event.target.closest(".favorite-btn");
    if (favoriteBtn && currentMyContentType === "my-articles") {
      const articleId = favoriteBtn.dataset.id;
      favoriteBtn.closest(".options-dropdown")?.classList.remove("visible"); // Cierra dropdown

      try {
        const result = await toggleFavoriteArticle(articleId);
        showSuccessToast(result.message);

        // Actualizar estado local
        currentUser.favorites = result.favorites;

        // Actualizar UI del botón de favorito
        const isFavorite = result.favorites.includes(articleId);
        favoriteBtn.dataset.isFavorite = isFavorite;
        favoriteBtn.innerHTML = `
                  <i class="${isFavorite ? "fas fa-star" : "far fa-star"}"></i> 
                  ${isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              `;
      } catch (error) {
        showErrorToast(error.message);
      }
      return;
    }

    // 4. Lógica para Editar (Botón en Menú) - SOLO ARTÍCULOS
    const editBtn = event.target.closest(".edit-btn");
    if (editBtn && currentMyContentType === "my-articles") {
      const articleIdToEdit = editBtn.dataset.id;
      openEditModal(articleIdToEdit);
      editBtn.closest(".options-dropdown")?.classList.remove("visible"); // Cierra dropdown
      return;
    }

    // 5. Lógica para Eliminar (Botón en Menú) - SOLO ARTÍCULOS
    const deleteArticleBtn = event.target.closest(".delete-btn");
    if (deleteArticleBtn && currentMyContentType === "my-articles") {
      const articleId = deleteArticleBtn.dataset.id;
      deleteArticleBtn
        .closest(".options-dropdown")
        ?.classList.remove("visible"); // Cierra dropdown

      const confirmDelete = window.confirm(
        "¿Estás seguro de eliminar esta pregunta? Esta acción es permanente."
      );
      if (confirmDelete) {
        try {
          await deleteArticle(articleId); // Servicio de article.service.js
          showSuccessToast("Pregunta eliminada correctamente.");
          // Recargar lista
          await loadMyContent("my-articles", currentUser);
          // Actualizar contadores
          await loadProfileStats();
        } catch (error) {
          showErrorToast(`Error al eliminar la pregunta: ${error.message}`);
        }
      }
      return;
    }

    // 6. Lógica para mostrar Modal de Eliminación de Comentario - SOLO COMENTARIOS
    const deleteCommentIcon = event.target.closest(".delete-my-comment-icon");
    if (deleteCommentIcon && currentMyContentType === "my-comments") {
      commentIdToDelete = deleteCommentIcon.dataset.commentId;
      deleteCommentConfirmModal?.classList.add("visible");
      return;
    }

    // 7. Lógica para el lightbox (solo para artículos)
    const link = event.target.closest(".article-image-link");
    if (link && currentMyContentType === "my-articles") {
      const modal = document.getElementById("image-preview-modal");
      const previewImage = document.getElementById("preview-image-src");
      if (modal && previewImage) {
        event.preventDefault();
        previewImage.src = link.href;
        modal.classList.add("visible");
      }
    }
  });

  // --- Lógica del Modal de Confirmación de Eliminación de Comentarios ---

  confirmCommentDeleteBtn?.addEventListener("click", async () => {
    if (commentIdToDelete) {
      try {
        await deleteComment(commentIdToDelete); // Servicio de comment.service.js
        showSuccessToast("Respuesta eliminada correctamente.");
        // Recargar lista
        await loadMyContent("my-comments", currentUser);
        // Actualizar contadores
        await loadProfileStats();
      } catch (error) {
        showErrorToast(`Error al eliminar la respuesta: ${error.message}`);
      } finally {
        deleteCommentConfirmModal?.classList.remove("visible");
        commentIdToDelete = null;
      }
    }
  });

  cancelCommentDeleteBtn?.addEventListener("click", () => {
    deleteCommentConfirmModal?.classList.remove("visible");
    commentIdToDelete = null;
  });

  deleteCommentConfirmModal?.addEventListener("click", (event) => {
    if (event.target === deleteCommentConfirmModal) {
      deleteCommentConfirmModal.classList.remove("visible");
    }
  });
  // --- Fin Lógica Modal de Confirmación ---

  // Cierre de dropdowns al hacer clic fuera del menú de opciones
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".article-options-menu")) {
      closeAllDropdowns();
    }
  });

  // --- Lógica del Menú de Opciones (Perfil y Cuenta) ---
  if (profileOptionsToggleBtn) {
    profileOptionsToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileOptionsDropdown?.classList.toggle("visible");
      accountOptionsDropdown?.classList.remove("visible"); // Cierra el otro
    });
  }
  if (accountOptionsToggleBtn) {
    accountOptionsToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      accountOptionsDropdown?.classList.toggle("visible");
      profileOptionsDropdown?.classList.remove("visible"); // Cierra el otro
    });
  }
  // Cerrar menús al hacer clic fuera
  document.addEventListener("click", (event) => {
    if (!profileOptionsMenu?.contains(event.target)) {
      profileOptionsDropdown?.classList.remove("visible");
    }
    if (!accountOptionsMenu?.contains(event.target)) {
      accountOptionsDropdown?.classList.remove("visible");
    }
  });

  // --- Botón Logout ---
  logoutBtnPerfil?.addEventListener("click", () => {
    logoutModal?.classList.add("visible");
    profileOptionsDropdown?.classList.remove("visible"); // Cierra dropdown si está abierto
  });
  cancelLogoutBtn?.addEventListener("click", () =>
    logoutModal?.classList.remove("visible")
  );
  confirmLogoutBtn?.addEventListener("click", async () => {
    try {
      await logoutUser();
      window.location.href = "/login.html";
    } catch (error) {
      showErrorToast("Error al cerrar sesión.");
    }
  });
  logoutModal?.addEventListener("click", (e) => {
    if (e.target === logoutModal) logoutModal.classList.remove("visible");
  });

  // --- Modal Editar Perfil ---
  editProfileBtn?.addEventListener("click", () => {
    if (fullProfileData) {
      document.getElementById("modal-username").value =
        fullProfileData.username || "";
      document.getElementById("modal-firstName").value =
        fullProfileData.profile.firstName || "";
      document.getElementById("modal-lastName").value =
        fullProfileData.profile.lastName || "";
      document.getElementById("modal-biography").value =
        fullProfileData.profile.biography || "";
      // Formatear fecha para input type="date" (YYYY-MM-DD)
      const birthDate = fullProfileData.profile.birthDate
        ? new Date(fullProfileData.profile.birthDate + "T00:00:00") // Asegura local
            .toISOString()
            .split("T")[0]
        : "";
      document.getElementById("modal-birthDate").value = birthDate;
    }
    profileModal?.classList.add("visible");
    profileOptionsDropdown?.classList.remove("visible");
  });

  cancelProfileBtn?.addEventListener("click", () =>
    profileModal?.classList.remove("visible")
  );
  profileModal?.addEventListener("click", (e) => {
    if (e.target === profileModal) profileModal.classList.remove("visible");
  });

  editProfileForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const profileData = {
      username: document.getElementById("modal-username").value.trim(),
      profile: {
        firstName: document.getElementById("modal-firstName").value.trim(),
        lastName: document.getElementById("modal-lastName").value.trim(),
        biography: document.getElementById("modal-biography").value.trim(),
        birthDate: document.getElementById("modal-birthDate").value || null, // Enviar null si está vacío
      },
    };

    // Validaciones básicas
    if (!profileData.username || profileData.username.length < 3) {
      showErrorToast("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (
      !profileData.profile.firstName ||
      profileData.profile.firstName.length < 2
    ) {
      showErrorToast("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (
      !profileData.profile.lastName ||
      profileData.profile.lastName.length < 2
    ) {
      showErrorToast("El apellido debe tener al menos 2 caracteres.");
      return;
    }

    try {
      const result = await updateProfileData(profileData); // Usa servicio
      showSuccessToast("Perfil guardado correctamente.");
      profileModal?.classList.remove("visible");
      await fetchProfile(); // Recarga los datos del perfil
    } catch (err) {
      showErrorToast(err.message);
    }
  });

  // --- Modal Editar Cuenta ---
  editAccountBtn?.addEventListener("click", () => {
    if (fullProfileData) {
      document.getElementById("modal-email").value =
        fullProfileData.email || "";
      document.getElementById("modal-currentPassword").value = "";
      document.getElementById("modal-newPassword").value = "";
      document.getElementById("modal-confirmPassword").value = "";
    }
    accountModal?.classList.add("visible");
    accountOptionsDropdown?.classList.remove("visible");
  });

  cancelAccountBtn?.addEventListener("click", () =>
    accountModal?.classList.remove("visible")
  );
  accountModal?.addEventListener("click", (e) => {
    if (e.target === accountModal) accountModal.classList.remove("visible");
  });

  editAccountForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("modal-email").value.trim();
    const currentPassword = document.getElementById(
      "modal-currentPassword"
    ).value;
    const newPassword = document.getElementById("modal-newPassword").value;
    const confirmPassword = document.getElementById(
      "modal-confirmPassword"
    ).value;
    let dataToSend = { email };
    // Validar email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      showErrorToast("El formato del correo electrónico no es válido.");
      return;
    }
    // Validar y añadir contraseña si se intenta cambiar
    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) {
        showErrorToast("Ingresa tu contraseña actual para cambiarla.");
        return;
      }
      if (!newPassword) {
        showErrorToast("Ingresa la nueva contraseña.");
        return;
      }
      if (newPassword.length < 8) {
        showErrorToast("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPasswordRegex.test(newPassword)) {
        showErrorToast(
          "La contraseña debe incluir mayúsculas, minúsculas, números y símbolos."
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        showErrorToast("Las nuevas contraseñas no coinciden.");
        return;
      }
      dataToSend.currentPassword = currentPassword;
      dataToSend.newPassword = newPassword;
    }

    try {
      const result = await updateAccountData(dataToSend); // Usa servicio
      showSuccessToast("Cuenta actualizada correctamente.");
      accountModal?.classList.remove("visible");
      await fetchProfile(); // Recarga los datos del perfil
    } catch (err) {
      showErrorToast(err.message);
    }
  });

  // --- Zona de Peligro ---
  deleteAccountBtn?.addEventListener("click", () => {
    deleteConfirmPasswordInput.value = ""; // Limpia contraseña anterior
    deleteAccountModal?.classList.add("visible");
  });

  cancelDeleteAccountBtn?.addEventListener("click", () => {
    deleteAccountModal?.classList.remove("visible");
  });

  confirmDeleteAccountBtn?.addEventListener("click", async () => {
    const password = deleteConfirmPasswordInput.value;
    if (!password) {
      showErrorToast("Ingresa tu contraseña para confirmar la eliminación.");
      return;
    }
    try {
      await deleteAccount(password); // Usa servicio de auth
      showSuccessToast("Cuenta eliminada correctamente. Serás redirigido.");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 2000);
    } catch (error) {
      showErrorToast(`Error al eliminar: ${error.message}`);
    }
  });

  deleteAccountModal?.addEventListener("click", (e) => {
    if (e.target === deleteAccountModal) {
      deleteAccountModal.classList.remove("visible");
    }
  });

  // --- Lógica para Editar Avatar ---
  avatarWrapper?.addEventListener("click", () => {
    avatarInput?.click();
  });

  avatarInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showErrorToast("Por favor, selecciona un archivo de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast("La imagen no debe superar los 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const result = await updateAvatarImage(formData); // Usa servicio
      avatarDisplay.src = result.avatarUrl + `?t=${new Date().getTime()}`; // Actualiza con timestamp
      showSuccessToast("Avatar actualizado correctamente.");
    } catch (error) {
      showErrorToast(`Error al actualizar avatar: ${error.message}`);
    } finally {
      avatarInput.value = ""; // Resetea input
    }
  });

  // --- Inicialización ---
  await fetchProfile(); // Carga inicial del perfil
  await loadProfileStats(); // CARGA INICIAL DE CONTADORES
  setupEditModalListeners(currentUser); // Configura listeners para el modal de edición
  switchSection("profile"); // Muestra la sección de perfil por defecto
});
