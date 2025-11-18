// public/js/pregunta.js
import { verifyAuth } from "./services/auth.service.js";
import {
  fetchArticleById,
  voteOnArticle,
  toggleFavoriteArticle,
  deleteArticle,
  updateArticle,
} from "./services/article.service.js";
import {
  postComment,
  deleteComment,
  voteOnComment,
} from "./services/comment.service.js";
import { toggleFavoriteComment } from "./services/profile.service.js";
import {
  renderArticleCard,
  initializeSymbolsPanel,
} from "./article/article.ui.js";
import { showSuccessToast, showErrorToast } from "./utils/notifications.js";
import { initializeLightbox } from "./utils/lightbox.js";
import { fetchAllTags } from "./services/tag.service.js";
import { getProfile } from "./services/profile.service.js";

// --- Elementos del Modal de Edición ---
const editQuestionModal = document.getElementById("edit-question-modal");
const editQuestionForm = document.getElementById("editQuestionForm");
const cancelEditBtn = document.getElementById("cancel-edit-question");
const closeEditModalBtn = document.getElementById("close-edit-modal");
const editFileInput = document.getElementById("edit-image-files");
const editFileNameDisplay = document.getElementById("edit-file-name-display");

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

const renderMainQuestion = (article, currentUser) => {
  const container = document.getElementById("main-question-container");
  if (container) {
    const userFavorites = currentUser.favorites || [];

    // === INICIO DE LA MODIFICACIÓN (Ocultar enlace "Ver discusión") ===
    // 1. Pasamos la nueva opción 'isDetailPage: true'
    let cardHtml = renderArticleCard(article, currentUser, userFavorites, {
      isDetailPage: true,
    });
    // === FIN DE LA MODIFICACIÓN ===

    container.innerHTML = cardHtml;
  }
};

// =========================================================================
// === Lógica de Renderizado Anidado (Corregida) ===
// =========================================================================

/**
 * Construye un árbol jerárquico a partir de una lista plana de comentarios.
 * @param {Array} comments - La lista plana de comentarios del backend.
 * @returns {Array} Un árbol de comentarios (solo nivel superior).
 */
const buildCommentTree = (comments) => {
  const commentMap = {};
  const tree = [];

  // 1. Crear un mapa de todos los comentarios por su ID
  comments.forEach((comment) => {
    // Importante: .replies DEBE inicializarse como array vacío
    commentMap[comment._id] = { ...comment, replies: [] };
  });

  // 2. Anidar comentarios
  comments.forEach((comment) => {
    if (comment.parentComment) {
      // Si tiene padre, busca al padre en el mapa
      const parent = commentMap[comment.parentComment];
      if (parent) {
        // Añade este comentario como 'reply' del padre
        parent.replies.push(commentMap[comment._id]);
      }
    } else {
      // Es un comentario de nivel superior
      tree.push(commentMap[comment._id]);
    }
  });

  // 3. Ordenar los comentarios de nivel superior (los anidados ya vienen ordenados por fecha)
  tree.sort(
    (a, b) => b.likes - a.likes || new Date(b.createdAt) - new Date(a.createdAt)
  );

  return tree;
};

/**
 * Crea y adjunta el formulario de respuesta para un comentario.
 * @param {HTMLElement} container - El elemento donde se inyectará el formulario.
 * @param {string} articleId - El ID del artículo.
 * @param {string} parentCommentId - El ID del comentario que se está respondiendo.
 * @param {Object} currentUser - El usuario logueado.
 */
const createAndAttachReplyForm = (
  container,
  articleId,
  parentCommentId,
  currentUser
) => {
  // Limpiar contenedor por si ya había un formulario
  container.innerHTML = "";

  // 1. Crear el formulario
  const form = document.createElement("form");
  const formId = `reply-form-${parentCommentId}`;
  form.className = "reply-form";
  form.id = formId;
  form.noValidate = true;

  // Almacén de archivos local para este formulario
  let replyFilesStore = [];

  // 2. Contenido del formulario (TextArea, Previews)
  const contentDiv = document.createElement("div");
  contentDiv.className = "comment-form-content";

  const previewsDiv = document.createElement("div");
  previewsDiv.className = "comment-file-previews";

  const textarea = document.createElement("textarea");
  textarea.className = "comment-textarea";
  textarea.placeholder = "Escribe tu respuesta...";
  textarea.rows = 1;

  contentDiv.appendChild(previewsDiv);
  contentDiv.appendChild(textarea);

  // 3. Footer (Botones)
  const footerDiv = document.createElement("div");
  footerDiv.className = "comment-actions-footer";

  const toolButtonsDiv = document.createElement("div");
  toolButtonsDiv.className = "comment-tool-buttons";

  const fileInputId = `reply-file-${parentCommentId}`;
  toolButtonsDiv.innerHTML = `
    <button type="button" class="comment-tool-btn" title="Adjuntar archivos">
      <i class="fas fa-paperclip"></i>
    </button>
    <input type="file" id="${fileInputId}" class="hidden-file-input" accept="image/jpeg, image/png, image/gif" multiple />
    <button type="button" class="comment-tool-btn" title="Símbolos">
      <i class="fas fa-square-root-alt"></i>
    </button>
  `;

  const actionButtonsDiv = document.createElement("div");
  actionButtonsDiv.className = "reply-action-buttons";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "modal-button secondary custom-cancel-button";
  cancelBtn.textContent = "Cancelar";

  // === INICIO DE LA MODIFICACIÓN (Botón de envío anidado) ===
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "comment-submit-btn"; // Clase para el botón de icono
  submitBtn.title = "Enviar respuesta"; // Título para accesibilidad
  submitBtn.innerHTML = `<i class="fas fa-arrow-up"></i>`; // Icono de flecha
  submitBtn.disabled = true;
  // === FIN DE LA MODIFICACIÓN ===

  actionButtonsDiv.appendChild(cancelBtn);
  actionButtonsDiv.appendChild(submitBtn);

  // 4. Panel de Símbolos
  const symbolPanelId = `reply-symbols-${parentCommentId}`;
  const symbolsPanel = document.createElement("div");
  symbolsPanel.id = symbolPanelId;
  symbolsPanel.className = "symbols-panel";

  // 5. Ensamblar formulario
  footerDiv.appendChild(toolButtonsDiv);
  footerDiv.appendChild(actionButtonsDiv);
  form.appendChild(contentDiv);
  form.appendChild(footerDiv);
  form.appendChild(symbolsPanel);
  container.appendChild(form);

  // --- 6. Lógica y Listeners para ESTE formulario ---

  const fileInput = document.getElementById(fileInputId);
  const fileUploadBtn = toolButtonsDiv.querySelector(
    "button[title='Adjuntar archivos']"
  );
  const symbolToggleBtn = toolButtonsDiv.querySelector(
    "button[title='Símbolos']"
  );

  const updateReplySubmitState = () => {
    const text = textarea.value.trim();
    const hasFiles = replyFilesStore.length > 0;
    submitBtn.disabled = !(text.length > 0 || hasFiles);
  };

  const renderReplyFilePreviews = () => {
    previewsDiv.innerHTML = "";
    if (replyFilesStore.length === 0) {
      previewsDiv.style.display = "none";
      return;
    }
    previewsDiv.style.display = "flex";
    replyFilesStore.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "file-preview-item";
      item.innerHTML = `
        <span class="file-preview-name">${file.name}</span>
        <button type="button" class="file-preview-remove" data-index="${index}" title="Quitar archivo">
          <i class="fas fa-times"></i>
        </button>
      `;
      previewsDiv.appendChild(item);
    });
    updateReplySubmitState();
  };

  textarea.addEventListener("input", (e) => {
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
    updateReplySubmitState();
  });

  cancelBtn.addEventListener("click", () => {
    container.innerHTML = ""; // Cierra el formulario
  });

  fileUploadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    replyFilesStore = [...replyFilesStore, ...files].slice(0, 5);
    if (files.length > 5) {
      showErrorToast("Puedes subir un máximo de 5 imágenes.");
    }
    renderReplyFilePreviews();
    e.target.value = null;
  });

  previewsDiv.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".file-preview-remove");
    if (removeBtn) {
      replyFilesStore.splice(parseInt(removeBtn.dataset.index, 10), 1);
      renderReplyFilePreviews();
    }
  });

  initializeSymbolsPanel({
    textareaId: textarea,
    toggleBtnId: symbolToggleBtn,
    panelId: symbolsPanel,
    includeFunctions: false,
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = textarea.value.trim();
    if (content.length < 5 && replyFilesStore.length === 0) {
      showErrorToast(
        "La respuesta debe tener al menos 5 caracteres o un archivo."
      );
      return;
    }

    submitBtn.disabled = true;
    // Cambiamos el icono a un spinner durante el envío
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

    const formData = new FormData();
    formData.append("content", content);
    formData.append("author", currentUser.id);
    formData.append("article", articleId);
    formData.append("parentComment", parentCommentId);
    replyFilesStore.forEach((file) => formData.append("imageFiles", file));

    try {
      await postComment(formData);
      window.location.reload();
    } catch (error) {
      showErrorToast(`Error al publicar respuesta: ${error.message}`);
      submitBtn.disabled = false;
      // Restauramos el icono de flecha
      submitBtn.innerHTML = `<i class="fas fa-arrow-up"></i>`;
    }
  });
};

/**
 * Renderiza un solo comentario y sus respuestas (recursivo).
 */
const renderCommentItem = (
  comment,
  currentUser,
  articleId,
  userFavoriteComments,
  level = 0 // Nivel de anidación
) => {
  const threadItem = document.createElement("div");
  threadItem.className = "comment-thread-item";
  threadItem.dataset.id = comment._id;

  // --- 1. Contenedor del Conector (Avatar, Líneas) ---
  const connectorContainer = document.createElement("div");
  connectorContainer.className = "comment-connector-container";

  // Avatar
  const author = comment.author;
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    author.profile.firstName || "NN"
  )}+${encodeURIComponent(author.profile.lastName || "")}&background=random`;
  const avatarUrl = author.profile?.avatarUrl || defaultAvatarUrl;

  const avatarImg = document.createElement("img");
  avatarImg.src = avatarUrl;
  avatarImg.alt = "Avatar";
  avatarImg.className = "author-avatar comment-avatar";
  avatarImg.loading = "lazy";

  // Botón de Colapsar
  const collapseBtn = document.createElement("button");
  collapseBtn.className = "comment-collapse-button";
  collapseBtn.title = "Colapsar hilo";
  const collapseBtnHtml = `
    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 10.625H6v-1.25h8v1.25ZM20 10a10 10 0 1 0-10 10 10.011 10.011 0 0 0 10-10Zm-1.25 0A8.75 8.75 0 1 1 10 1.25 8.76 8.76 0 0 1 18.75 10Z"></path>
    </svg>`;
  collapseBtn.innerHTML = collapseBtnHtml;

  const expandBtnHtml = `
    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.625 9.375H14v1.25h-3.375V14h-1.25v-3.375H6v-1.25h3.375V6h1.25v3.375ZM20 10A10 10 0 1 1 10 0a10.011 10.011 0 0 1 10 10Zm-1.25 0A8.75 8.75 0 1 0 10 18.75 8.76 8.76 0 0 0 18.75 10Z"></path>
    </svg>`;

  // Línea vertical
  const connectorLine = document.createElement("div");
  connectorLine.className = "comment-connector-line";

  // Ensamblar conector
  connectorContainer.appendChild(avatarImg); // <-- MODIFICADO: Avatar primero
  connectorContainer.appendChild(collapseBtn); // <-- MODIFICADO: Botón después
  connectorContainer.appendChild(connectorLine);

  // --- 2. Contenedor del Contenido (Header, Body, Footer, Respuestas) ---
  const contentContainer = document.createElement("div");
  contentContainer.className = "comment-content-container";

  // --- 2a. Header ---
  const header = document.createElement("div");
  header.className = "comment-header";

  const isCommentAuthor = currentUser.id === author._id;
  const canDelete = currentUser.role === "admin" || isCommentAuthor;
  const commentAuthorUsername = author.username || "Usuario Desconocido";

  let statusBadges = "";
  if (author.role === "admin") {
    statusBadges += `<span class="admin-badge">Administrador</span>`;
  }
  if (isCommentAuthor) {
    statusBadges += `<span class="author-badge">Tú</span>`;
  }

  // === LÓGICA PARA ICONO DE VERIFICADO EN COMENTARIOS ===
  let verifiedBadge = "";
  if (author.teacherStatus === "verified") {
    verifiedBadge = `<i class="fas fa-check-circle" style="color: #27ae60; margin-left: 5px;" title="Docente Verificado"></i>`;
  }

  const authorLinkHref = isCommentAuthor
    ? "/perfil.html"
    : `/usuario.html?id=${author._id}`;

  const authorInfoHtml = `
    <div class="comment-author-date">
      <a href="${authorLinkHref}" class="author-link" style="gap: 10px;">
        <div class="author-text-group">
            <span class="comment-author">${commentAuthorUsername}${verifiedBadge}</span>
            ${statusBadges}
        </div>
      </a>
      <span class="comment-date">${formatRelativeTime(comment.createdAt)}</span>
    </div>
  `;

  // Menú de Opciones (Favorito, Eliminar, Editar)
  const isFavorite = userFavoriteComments.includes(comment._id);
  const favoriteIconClass = isFavorite ? "fas fa-star" : "far fa-star";
  const favoriteTitle = isFavorite
    ? "Quitar de favoritos"
    : "Añadir a favoritos";

  const optionsMenu = document.createElement("div");
  optionsMenu.className = "comment-options-menu";
  optionsMenu.innerHTML = `
    <button class="options-toggle-btn"><i class="fas fa-ellipsis-v"></i></button>
    <div class="options-dropdown">
      <button class="dropdown-item favorite-comment-btn" data-comment-id="${
        comment._id
      }" data-is-favorite="${isFavorite}" title="${favoriteTitle}">
        <i class="${favoriteIconClass}"></i> ${favoriteTitle}
      </button>
      ${
        isCommentAuthor
          ? `<button class="dropdown-item edit-comment-btn" data-comment-id="${comment._id}"><i class="fas fa-edit"></i> Editar</button>`
          : ""
      }
      ${
        canDelete
          ? `<button class="dropdown-item delete-comment-btn" data-comment-id="${comment._id}"><i class="fas fa-trash-alt"></i> Eliminar</button>`
          : ""
      }
    </div>
  `;

  header.innerHTML = authorInfoHtml;
  header.appendChild(optionsMenu);

  // --- 2b. Contenido (Texto e Imágenes) ---
  const contentBody = document.createElement("div");
  contentBody.className = "comment-content";
  contentBody.innerHTML = `<p>${comment.content}</p>`;

  if (comment.imageUrls && comment.imageUrls.length > 0) {
    const imageElements = comment.imageUrls
      .map(
        (url) => `
      <a href="${url}" class="article-image-link">
        <img src="${url}" alt="Imagen de la respuesta" class="article-image"/>
      </a>`
      )
      .join("");
    contentBody.innerHTML += `<div class="article-images-gallery">${imageElements}</div>`;
  }

  // --- 2c. Footer (Votos y Botón Reply) ---
  const footer = document.createElement("div");
  footer.className = "comment-footer";

  const userHasLiked = (comment.votedUp || []).includes(currentUser.id);
  const userHasDisliked = (comment.votedDown || []).includes(currentUser.id);

  // === INICIO DE LA MODIFICACIÓN (Iconos de Pulgares) ===
  footer.innerHTML = `
    <div class="vote-controls">
      <div class="vote-group">
        <button class="vote-btn like ${
          userHasLiked ? "active" : ""
        }" data-comment-id="${
    comment._id
  }" data-vote-type="like" title="Me gusta">
          <i class="fas fa-thumbs-up"></i>
        </button>
        <span class="vote-count like-count">${comment.likes || 0}</span>
      </div>
      <div class="vote-group">
        <button class="vote-btn dislike ${
          userHasDisliked ? "active" : ""
        }" data-comment-id="${
    comment._id
  }" data-vote-type="dislike" title="No me gusta">
          <i class="fas fa-thumbs-down"></i>
        </button>
        <span class="vote-count dislike-count">${comment.dislikes || 0}</span>
      </div>
    </div>
    <button class="reply-btn-ghost reply-comment-btn" data-comment-id="${
      comment._id
    }">
      <i class="far fa-comment-dots"></i> Responder
    </button>
  `;
  // === FIN DE LA MODIFICACIÓN ===

  // --- 2d. Contenedor del Formulario de Respuesta (vacío por defecto) ---
  const replyFormContainer = document.createElement("div");
  replyFormContainer.className = "reply-form-container";
  replyFormContainer.id = `reply-form-container-${comment._id}`;

  // --- 2e. Contenedor de Respuestas Anidadas ---
  const repliesContainer = document.createElement("div");
  repliesContainer.className = "comment-replies-container";

  // --- 3. Ensamblaje ---
  const card = document.createElement("div");
  card.className = "comment-card";
  card.appendChild(header);
  card.appendChild(contentBody);
  card.appendChild(footer);
  card.appendChild(replyFormContainer);

  contentContainer.appendChild(card);
  contentContainer.appendChild(repliesContainer); // Las respuestas van DESPUÉS de la tarjeta

  threadItem.appendChild(connectorContainer);
  threadItem.appendChild(contentContainer);

  // --- 4. Lógica de Colapsar ---
  collapseBtn.addEventListener("click", () => {
    const isCollapsed = threadItem.classList.toggle("is-collapsed");
    collapseBtn.title = isCollapsed ? "Expandir hilo" : "Colapsar hilo";
    collapseBtn.innerHTML = isCollapsed ? expandBtnHtml : collapseBtnHtml;

    // ************************************************************
    // *
    // * ¡AQUÍ ESTÁ LA CORRECCIÓN!
    // * Esta línea es la que ocultaba el avatar. La comentamos:
    // *
    // avatarImg.style.display = isCollapsed ? "none" : "block"; // Oculta avatar al colapsar
    // *
    // ************************************************************
  });

  // Ocultar botón de colapsar si no hay respuestas
  if (!comment.replies || comment.replies.length === 0) {
    collapseBtn.style.visibility = "hidden";
    connectorLine.style.display = "none"; // Ocultar línea si no hay respuestas
  }

  // --- 5. Lógica de "Responder" ---
  const replyBtn = footer.querySelector(".reply-comment-btn");
  replyBtn.addEventListener("click", () => {
    if (replyFormContainer.hasChildNodes()) {
      replyFormContainer.innerHTML = "";
    } else {
      createAndAttachReplyForm(
        replyFormContainer,
        articleId,
        comment._id,
        currentUser
      );
    }
  });

  // --- 6. Renderizado Recursivo de Respuestas ---
  if (comment.replies && comment.replies.length > 0) {
    comment.replies.forEach((reply) => {
      // Las respuestas siempre van en el repliesContainer
      repliesContainer.appendChild(
        renderCommentItem(
          reply,
          currentUser,
          articleId,
          userFavoriteComments,
          level + 1 // Incrementa el nivel
        )
      );
    });
  }

  return threadItem;
};

/**
 * Función principal para renderizar la lista de comentarios.
 */
const renderComments = (comments, currentUser, articleId) => {
  const container = document.getElementById("comments-list");
  if (!container) return;

  container.innerHTML = ""; // Limpiar el contenedor

  const userFavoriteComments = currentUser.favoriteComments || [];

  // 1. Construir el árbol a partir de la lista plana
  const commentTree = buildCommentTree(comments);

  if (commentTree.length === 0) {
    container.innerHTML =
      "<p>Aún no hay respuestas. ¡Sé el primero en responder!</p>";
    return;
  }

  // 2. Renderizar el árbol (solo Nivel 0)
  commentTree.forEach((comment) => {
    container.appendChild(
      renderCommentItem(
        comment,
        currentUser,
        articleId,
        userFavoriteComments,
        0 // Nivel 0
      )
    );
  });
};

// =========================================================================
// === FIN DE LA MODIFICACIÓN (Lógica de Renderizado Anidado) ===
// =========================================================================

// **********************************************
// LÓGICA DE EDICIÓN DE PREGUNTA (Sin cambios)
// **********************************************

const openEditModal = async (articleId) => {
  if (!editQuestionModal) return;

  try {
    // NOTA: fetchArticleById ahora devuelve un objeto con 'comments' como array plano.
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
      // Corrección: article.tags[0] puede ser un ID o un objeto
      const articleTagId =
        article.tags && article.tags[0]
          ? article.tags[0]._id || article.tags[0]
          : null;
      if (articleTagId && tag._id === articleTagId) {
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
    await updateArticle(articleId, formData);
    showSuccessToast("Pregunta actualizada con éxito. Recargando...");
    editQuestionModal?.classList.remove("visible");

    // Recargar la página para ver los cambios y el estado del menú
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    showErrorToast(`Error al actualizar: ${error.message}`);
    console.error("Error en submit edit:", error);
  }
};

const setupEditModalListeners = () => {
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

// **********************************************
// === Formulario de Comentarios Principal (Sin cambios) ===
// **********************************************
let commentFilesStore = [];

const commentForm = document.getElementById("comment-form");
const commentTextArea = document.getElementById("comment-content");
const commentSubmitBtn = document.getElementById("comment-submit-btn");
const commentFileUploadBtn = document.getElementById("comment-file-upload-btn");
const commentFileInput = document.getElementById("comment-image-files-input");
const commentFilePreviews = document.getElementById("comment-file-previews");

const updateSubmitButtonState = () => {
  if (!commentTextArea || !commentSubmitBtn) return;
  const text = commentTextArea.value.trim();
  const hasFiles = commentFilesStore.length > 0;

  if (text.length > 0 || hasFiles) {
    commentSubmitBtn.disabled = false;
  } else {
    commentSubmitBtn.disabled = true;
  }
};

const handleCommentTextInput = (e) => {
  const target = e.target;
  target.style.height = "auto";
  target.style.height = `${target.scrollHeight}px`;
  updateSubmitButtonState();
};

const renderCommentFilePreviews = () => {
  if (!commentFilePreviews) return;
  commentFilePreviews.innerHTML = "";

  if (commentFilesStore.length === 0) {
    commentFilePreviews.style.display = "none";
    return;
  }

  commentFilePreviews.style.display = "flex";
  commentFilesStore.forEach((file, index) => {
    const filePreview = document.createElement("div");
    filePreview.className = "file-preview-item";
    filePreview.innerHTML = `
      <span class="file-preview-name">${file.name}</span>
      <button type="button" class="file-preview-remove" data-index="${index}" title="Quitar archivo">
        <i class="fas fa-times"></i>
      </button>
    `;
    commentFilePreviews.appendChild(filePreview);
  });
  updateSubmitButtonState();
};

const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  if (!files) return;

  commentFilesStore = [...commentFilesStore, ...files];

  if (commentFilesStore.length > 5) {
    showErrorToast("Puedes subir un máximo de 5 imágenes.");
    commentFilesStore = commentFilesStore.slice(0, 5); // Truncar al límite
  }

  renderCommentFilePreviews();
  e.target.value = null; // Resetea el input para permitir volver a seleccionar
};

const handleFileRemove = (e) => {
  const removeBtn = e.target.closest(".file-preview-remove");
  if (removeBtn) {
    const indexToRemove = parseInt(removeBtn.dataset.index, 10);
    commentFilesStore.splice(indexToRemove, 1);
    renderCommentFilePreviews();
  }
};

// =====================================================================
// === DOMContentLoaded ===
// =====================================================================

document.addEventListener("DOMContentLoaded", async () => {
  let currentUser;
  try {
    const authData = await verifyAuth();
    const profileData = await getProfile();
    currentUser = {
      ...authData.data,
      favorites: profileData.favorites || [],
      favoriteComments: profileData.favoriteComments || [],
    };
    document.getElementById("logged-in-username").textContent =
      currentUser.firstName;
  } catch (error) {
    window.location.href = "/login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const articleId = params.get("id");
  let currentArticle = null;

  if (!articleId) {
    document.body.innerHTML = "<h1>Error: No se especificó una pregunta.</h1>";
    return;
  }

  // --- Conectar listeners del formulario de comentario PRINCIPAL ---
  if (commentTextArea) {
    commentTextArea.addEventListener("input", handleCommentTextInput);
  }
  if (commentFileUploadBtn) {
    commentFileUploadBtn.addEventListener("click", () =>
      commentFileInput?.click()
    );
  }
  if (commentFileInput) {
    commentFileInput.addEventListener("change", handleFileChange);
  }
  if (commentFilePreviews) {
    commentFilePreviews.addEventListener("click", handleFileRemove);
  }
  // --- Fin listeners formulario principal ---

  try {
    const article = await fetchArticleById(articleId);
    currentArticle = article;
    renderMainQuestion(article, currentUser);

    // === INICIO MODIFICACIÓN ===
    // Pasamos el articleId a renderComments para los formularios de respuesta
    renderComments(article.comments, currentUser, articleId);
    // === FIN MODIFICACIÓN ===

    initializeLightbox("main-question-container");
    initializeLightbox("comments-list"); // Esto cubrirá las imágenes de todos los comentarios

    setupEditModalListeners();

    // Inicializa el panel de símbolos para el formulario PRINCIPAL
    initializeSymbolsPanel({
      textareaId: "comment-content",
      toggleBtnId: "toggle-comment-symbols-btn",
      panelId: "comment-symbols-panel",
      includeFunctions: false,
    });

    // --- Listener para el formulario de comentario PRINCIPAL ---
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const content = commentTextArea.value.trim();
      const files = commentFilesStore;

      if (content.length < 5 && files.length === 0) {
        showErrorToast(
          "La respuesta debe tener al menos 5 caracteres o un archivo adjunto."
        );
        return;
      }
      if (files.length > 5) {
        showErrorToast("Puedes subir un máximo de 5 imágenes.");
        return;
      }

      const formData = new FormData();
      formData.append("content", content);
      formData.append("author", currentUser.id);
      formData.append("article", articleId);
      // No se añade parentComment (es un comentario Nivel 0)

      for (const file of files) {
        formData.append("imageFiles", file);
      }

      commentSubmitBtn.disabled = true;

      try {
        await postComment(formData);
        window.location.reload();
      } catch (error) {
        showErrorToast(`Error al publicar tu respuesta: ${error.message}`);
        commentSubmitBtn.disabled = false;
      }
    });
    // --- Fin listener formulario principal ---

    const commentsList = document.getElementById("comments-list");
    const deleteConfirmModal = document.getElementById("delete-confirm-modal");
    const confirmDeleteBtn = document.getElementById("confirm-delete");
    const cancelDeleteBtn = document.getElementById("cancel-delete");
    let commentIdToDelete = null;

    // --- Funciones de utilidad para menús ---
    const closeAllDropdowns = () => {
      document
        .querySelectorAll(".options-dropdown.visible")
        .forEach((d) => d.classList.remove("visible"));
    };

    const handleToggleMenu = (event) => {
      const toggleBtn = event.target.closest(".options-toggle-btn");
      if (toggleBtn) {
        const dropdown =
          toggleBtn.parentElement.querySelector(".options-dropdown");
        if (dropdown) {
          const isVisible = dropdown.classList.contains("visible");
          closeAllDropdowns();
          if (!isVisible) dropdown.classList.add("visible");
        }
        return true;
      }
      return false;
    };
    // --- Fin Funciones de utilidad para menús ---

    // Listener para los comentarios (y su menú de opciones)
    commentsList.addEventListener("click", async (event) => {
      if (handleToggleMenu(event)) return;

      const deleteBtn = event.target.closest(".delete-comment-btn");
      if (deleteBtn) {
        commentIdToDelete = deleteBtn.dataset.commentId;
        deleteConfirmModal.classList.add("visible");
      }

      const editBtn = event.target.closest(".edit-comment-btn");
      if (editBtn) {
        showErrorToast(
          "La función de editar respuestas estará disponible próximamente."
        );
        // Aquí iría la lógica para abrir un modal de edición de comentario
      }

      const favoriteBtn = event.target.closest(".favorite-comment-btn");
      if (favoriteBtn && favoriteBtn.dataset.commentId) {
        const commentId = favoriteBtn.dataset.commentId;

        try {
          const result = await toggleFavoriteComment(commentId);
          showSuccessToast(result.message);

          currentUser.favoriteComments = result.favoriteComments;
          const isFavorite = currentUser.favoriteComments.includes(commentId);

          favoriteBtn.dataset.isFavorite = isFavorite;
          favoriteBtn.title = isFavorite
            ? "Quitar de favoritos"
            : "Añadir a favoritos";
          favoriteBtn.innerHTML = `<i class="${
            isFavorite ? "fas fa-star" : "far fa-star"
          }"></i> ${favoriteBtn.title}`;
        } catch (error) {
          showErrorToast(error.message);
        }
        return;
      }

      const voteBtn = event.target.closest(".vote-btn");
      if (voteBtn && voteBtn.dataset.commentId) {
        const commentId = voteBtn.dataset.commentId;
        const voteType = voteBtn.dataset.voteType;

        try {
          const updatedResponse = await voteOnComment(commentId, voteType);
          const updatedCommentData = updatedResponse.data;

          const commentCard = document.querySelector(
            `.comment-thread-item[data-id="${commentId}"]`
          );
          if (commentCard) {
            commentCard.querySelector(".like-count").textContent =
              updatedCommentData.likes;
            commentCard.querySelector(".dislike-count").textContent =
              updatedCommentData.dislikes;

            const likeBtn = commentCard.querySelector(".vote-btn.like");
            const dislikeBtn = commentCard.querySelector(".vote-btn.dislike");

            likeBtn.classList.toggle(
              "active",
              updatedCommentData.votedUp.includes(currentUser.id)
            );
            dislikeBtn.classList.toggle(
              "active",
              updatedCommentData.votedDown.includes(currentUser.id)
            );
          }
        } catch (error) {
          showErrorToast(error.message);
        }
      }
    });

    const mainQuestionContainer = document.getElementById(
      "main-question-container"
    );

    // Listener para la pregunta principal
    mainQuestionContainer.addEventListener("click", async (event) => {
      if (handleToggleMenu(event)) return;

      const favoriteBtn = event.target.closest(".favorite-btn");
      if (favoriteBtn && favoriteBtn.dataset.id) {
        const articleId = favoriteBtn.dataset.id;
        try {
          const result = await toggleFavoriteArticle(articleId);
          showSuccessToast(result.message);

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

      const voteBtn = event.target.closest(".vote-btn");
      if (voteBtn && voteBtn.dataset.articleId) {
        const articleId = voteBtn.dataset.articleId;
        const voteType = voteBtn.dataset.voteType;

        try {
          const updatedVotes = await voteOnArticle(articleId, voteType);
          const articleCard = mainQuestionContainer.querySelector(
            `.article-card[data-id="${articleId}"]`
          );
          if (articleCard) {
            articleCard.querySelector(".like-count").textContent =
              updatedVotes.likes;
            articleCard.querySelector(".dislike-count").textContent =
              updatedVotes.dislikes;

            const likeBtn = articleCard.querySelector(".vote-btn.like");
            const dislikeBtn = articleCard.querySelector(".vote-btn.dislike");

            likeBtn.classList.toggle(
              "active",
              updatedVotes.votedUp.includes(currentUser.id)
            );
            dislikeBtn.classList.toggle(
              "active",
              updatedVotes.votedDown.includes(currentUser.id)
            );
          }
        } catch (error) {
          showErrorToast(error.message);
        }
      }

      const editBtn = event.target.closest(".edit-btn");
      if (editBtn) {
        const articleIdToEdit = editBtn.dataset.id;
        openEditModal(articleIdToEdit);
      }

      const deleteArticleBtn = event.target.closest(".delete-btn");
      if (deleteArticleBtn) {
        const confirmDelete = window.confirm(
          "¿Estás seguro de eliminar esta pregunta?"
        );
        if (confirmDelete) {
          try {
            await deleteArticle(articleId);
            showSuccessToast("Pregunta eliminada. Redirigiendo...");
            setTimeout(() => {
              window.location.href = "/"; // Volver al feed
            }, 1000);
          } catch (error) {
            showErrorToast(`Error al eliminar: ${error.message}`);
          }
        }
      }
    });

    // Cierre de dropdowns al hacer clic fuera
    document.addEventListener("click", (event) => {
      if (
        !event.target.closest(".comment-options-menu") &&
        !event.target.closest(".article-options-menu") &&
        !event.target.closest("#edit-question-modal")
      ) {
        closeAllDropdowns();
      }
    });

    confirmDeleteBtn.addEventListener("click", async () => {
      if (commentIdToDelete) {
        try {
          await deleteComment(commentIdToDelete);
          showSuccessToast("Respuesta eliminada correctamente.");
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          showErrorToast(error.message);
        } finally {
          deleteConfirmModal.classList.remove("visible");
          commentIdToDelete = null;
        }
      }
    });

    cancelDeleteBtn.addEventListener("click", () => {
      deleteConfirmModal.classList.remove("visible");
      commentIdToDelete = null;
    });

    deleteConfirmModal.addEventListener("click", (event) => {
      if (event.target === deleteConfirmModal) {
        deleteConfirmModal.classList.remove("visible");
      }
    });
  } catch (error) {
    document.body.innerHTML = `<h1>Error al cargar la pregunta: ${error.message}</h1>`;
  }
});
