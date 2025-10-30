// public/js/pregunta.js
import { verifyAuth } from "./services/auth.service.js";
import {
  fetchArticleById,
  voteOnArticle,
  toggleFavoriteArticle,
  deleteArticle,
} from "./services/article.service.js"; // Asegurar toggleFavoriteArticle importado
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
    // Es fundamental pasar la lista de favoritos para que el botón de estrella se renderice correctamente
    const userFavorites = currentUser.favorites || [];
    let cardHtml = renderArticleCard(article, currentUser, userFavorites);

    // Eliminamos el enlace de "Ver discusión" para la pregunta principal
    cardHtml = cardHtml.replace(
      /<a href="\/pregunta\.html\?id=.*">Ver discusión y responder<\/a>/,
      ""
    );
    container.innerHTML = cardHtml;
  }
};

const renderComments = (comments, currentUser) => {
  const container = document.getElementById("comments-list");
  if (!container) return;

  // Acceder a la lista de comentarios favoritos del usuario
  const userFavoriteComments = currentUser.favoriteComments || [];

  if (comments.length === 0) {
    container.innerHTML =
      "<p>Aún no hay respuestas. ¡Sé el primero en responder!</p>";
    return;
  }

  container.innerHTML = comments
    .map((comment) => {
      const canDelete =
        currentUser.role === "admin" || currentUser.id === comment.author._id;

      // Lógica de favorito para el comentario
      const isFavorite = userFavoriteComments.includes(comment._id);
      const favoriteIconClass = isFavorite ? "fas fa-star" : "far fa-star";
      const favoriteTitle = isFavorite
        ? "Quitar de favoritos"
        : "Añadir a favoritos";

      let statusBadges = "";
      if (comment.author.role === "admin") {
        statusBadges += `<span class="admin-badge">Administrador</span>`;
      }
      if (currentUser.id === comment.author._id) {
        statusBadges += `<span class="author-badge">Tú</span>`;
      }

      // Botón de favorito para el menú de opciones
      const favoriteButtonHtml = `
            <button 
                class="dropdown-item favorite-comment-btn" 
                data-comment-id="${comment._id}"
                data-is-favorite="${isFavorite}"
                title="${favoriteTitle}"
            >
                <i class="${favoriteIconClass}"></i> ${favoriteTitle}
            </button>`;

      const deleteButtonHtml = `
                <button class="dropdown-item delete-comment-btn" data-comment-id="${comment._id}">
                  <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            `;

      const optionsMenuHtml = `
        <div class="comment-options-menu">
             <button class="options-toggle-btn">
               <i class="fas fa-ellipsis-v"></i>
             </button>
             <div class="options-dropdown">
               ${favoriteButtonHtml} 
               ${canDelete ? deleteButtonHtml : ""}
             </div>
        </div>`;

      // ************* INICIO DEL CÓDIGO MEJORADO (renderComments) *************
      // Garantizar que votedUp/votedDown son arrays (aunque el modelo tiene defaults, es más seguro en el cliente)
      const commentVotedUp = comment.votedUp || [];
      const commentVotedDown = comment.votedDown || [];

      const userHasLiked = commentVotedUp.includes(currentUser.id);
      const userHasDisliked = commentVotedDown.includes(currentUser.id);

      const voteControlsHtml = `
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
                <span class="vote-count dislike-count">${
                  comment.dislikes || 0
                }</span>
            </div>
        </div>
    `;
      // ************* FIN DEL CÓDIGO MEJORADO (renderComments) *************

      return `
        <div class="comment-card" data-id="${comment._id}">
            <div class="comment-header">
                <div class="comment-author-date">
                    <span class="comment-author">${
                      comment.author.profile.firstName
                    } ${comment.author.profile.lastName}</span>
                    ${statusBadges}
                    <span class="comment-date">${formatRelativeTime(
                      comment.createdAt
                    )}</span>
                </div>
                ${optionsMenuHtml}
            </div>
            <div class="comment-content">
                <p>${comment.content}</p>
            </div>
            <div class="comment-footer">
                ${voteControlsHtml}
            </div>
        </div>`;
    })
    .join("");
};

document.addEventListener("DOMContentLoaded", async () => {
  let currentUser;
  try {
    const authData = await verifyAuth();
    // Reestructuramos currentUser para incluir favoritos
    currentUser = {
      ...authData.data,
      favorites: authData.data.favorites || [], // Aseguramos que favorites esté presente
      favoriteComments: authData.data.favoriteComments || [],
    };
    document.getElementById("logged-in-username").textContent =
      currentUser.firstName;
  } catch (error) {
    window.location.href = "/login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const articleId = params.get("id");
  let currentArticle = null; // Guardar el artículo para usar en editar/eliminar

  if (!articleId) {
    document.body.innerHTML = "<h1>Error: No se especificó una pregunta.</h1>";
    return;
  }

  try {
    const article = await fetchArticleById(articleId);
    currentArticle = article;
    renderMainQuestion(article, currentUser);
    renderComments(article.comments, currentUser);

    initializeLightbox("main-question-container");
    initializeSymbolsPanel({
      textareaId: "comment-content",
      toggleBtnId: "toggle-comment-symbols-btn",
      panelId: "comment-symbols-panel",
      includeFunctions: false,
    });

    const commentForm = document.getElementById("comment-form");
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = e.target.content.value.trim();
      if (content.length < 5) {
        showErrorToast("La respuesta debe tener al menos 5 caracteres.");
        return;
      }
      try {
        await postComment({
          content,
          author: currentUser.id,
          article: articleId,
        });
        window.location.reload();
      } catch (error) {
        showErrorToast(`Error al publicar tu respuesta: ${error.message}`);
      }
    });

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
        const dropdown = toggleBtn.nextElementSibling;
        closeAllDropdowns(); // Cerrar todos antes de abrir uno
        dropdown.classList.toggle("visible");
        return true;
      }
      return false;
    };
    // --- Fin Funciones de utilidad para menús ---

    // Listener para los comentarios (y su menú de opciones)
    commentsList.addEventListener("click", async (event) => {
      // --- Lógica para el menú de opciones (Comentarios) ---
      if (handleToggleMenu(event)) return;

      // --- Lógica para el botón de eliminar ---
      const deleteBtn = event.target.closest(".delete-comment-btn");
      if (deleteBtn) {
        commentIdToDelete = deleteBtn.dataset.commentId;
        deleteConfirmModal.classList.add("visible");
        deleteBtn.closest(".options-dropdown").classList.remove("visible");
      }

      // --- LÓGICA para el botón de favorito de comentarios ---
      const favoriteBtn = event.target.closest(".favorite-comment-btn");
      if (favoriteBtn && favoriteBtn.dataset.commentId) {
        const commentId = favoriteBtn.dataset.commentId;

        try {
          const result = await toggleFavoriteComment(commentId);
          showSuccessToast(result.message);

          // Actualizar estado local y UI
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

      // --- Lógica para los botones de voto de comentarios ---
      const voteBtn = event.target.closest(".vote-btn");
      if (voteBtn && voteBtn.dataset.commentId) {
        const commentId = voteBtn.dataset.commentId;
        const voteType = voteBtn.dataset.voteType;

        try {
          const updatedResponse = await voteOnComment(commentId, voteType);
          // ************* CORRECCIÓN CLAVE *************
          // La data del voto está anidada en la propiedad 'data' de la respuesta del servicio
          const updatedCommentData = updatedResponse.data;

          const commentCard = document.querySelector(
            `.comment-card[data-id="${commentId}"]`
          );
          if (commentCard) {
            commentCard.querySelector(".like-count").textContent =
              updatedCommentData.likes;
            commentCard.querySelector(".dislike-count").textContent =
              updatedCommentData.dislikes;

            const likeBtn = commentCard.querySelector(".vote-btn.like");
            const dislikeBtn = commentCard.querySelector(".vote-btn.dislike");

            // No es necesario un chequeo extra aquí porque el backend garantiza que son arrays
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

    // Listener para la pregunta principal (incluye menú de opciones y voto de artículo)
    mainQuestionContainer.addEventListener("click", async (event) => {
      // --- Lógica para el menú de opciones (Pregunta Principal) ---
      if (handleToggleMenu(event)) return; // <-- CORREGIDO: Mantiene el manejo del menú

      // --- Lógica para el botón de favorito de artículos (Pregunta Principal) ---
      const favoriteBtn = event.target.closest(".favorite-btn");
      if (favoriteBtn && favoriteBtn.dataset.id) {
        const articleId = favoriteBtn.dataset.id;

        try {
          const result = await toggleFavoriteArticle(articleId);
          showSuccessToast(result.message);

          // Actualizar UI del botón de favorito
          const isFavorite = result.favorites.includes(articleId);
          favoriteBtn.dataset.isFavorite = isFavorite;
          favoriteBtn.innerHTML = `
                    <i class="${
                      isFavorite ? "fas fa-star" : "far fa-star"
                    }"></i> 
                    ${isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                `;
        } catch (error) {
          showErrorToast(error.message);
        }
        return;
      }

      // --- Lógica para los botones de voto de artículos ---
      const voteBtn = event.target.closest(".vote-btn");
      if (voteBtn && voteBtn.dataset.articleId) {
        // Aseguramos que sea un voto de artículo
        const articleId = voteBtn.dataset.articleId;
        const voteType = voteBtn.dataset.voteType;

        try {
          const updatedResponse = await voteOnArticle(articleId, voteType);
          const updatedVotes = updatedResponse.data; // La data viene anidada

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

      // --- Lógica para el botón EDITAR (simulada) ---
      const editBtn = event.target.closest(".edit-btn");
      if (editBtn) {
        // Aquí iría la lógica para abrir el modal de edición
        showErrorToast(
          "Funcionalidad de edición no implementada en esta vista."
        );
      }

      // --- Lógica para el botón ELIMINAR (simulada) ---
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

    // Cierre de dropdowns al hacer clic fuera del menú de comentarios y preguntas
    document.addEventListener("click", (event) => {
      if (
        !event.target.closest(".comment-options-menu") &&
        !event.target.closest(".article-options-menu")
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
