import { verifyAuth } from "./services/auth.service.js";
import { fetchArticleById } from "./services/article.service.js";
import { postComment, deleteComment } from "./services/comment.service.js";
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
    let cardHtml = renderArticleCard(article, currentUser);
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

  if (comments.length === 0) {
    container.innerHTML =
      "<p>Aún no hay respuestas. ¡Sé el primero en responder!</p>";
    return;
  }

  container.innerHTML = comments
    .map((comment) => {
      const canDelete =
        currentUser.role === "admin" || currentUser.id === comment.author._id;

      // ✅ INICIO DE LA LÓGICA PARA LAS ETIQUETAS
      let statusBadges = "";
      if (comment.author.role === "admin") {
        statusBadges += `<span class="admin-badge">Administrador</span>`;
      }
      if (currentUser.id === comment.author._id) {
        statusBadges += `<span class="author-badge">Tú</span>`;
      }
      // ✅ FIN DE LA LÓGICA

      const optionsMenuHtml = canDelete
        ? `<div class="comment-options-menu">
             <button class="options-toggle-btn">
               <i class="fas fa-ellipsis-v"></i>
             </button>
             <div class="options-dropdown">
               <button class="dropdown-item delete-comment-btn" data-comment-id="${comment._id}">
                 <i class="fas fa-trash-alt"></i> Eliminar
               </button>
             </div>
           </div>`
        : "";

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
        </div>`;
    })
    .join("");
};

document.addEventListener("DOMContentLoaded", async () => {
  let currentUser;
  try {
    const authData = await verifyAuth();
    currentUser = authData.data;
    document.getElementById("logged-in-username").textContent =
      currentUser.firstName;
  } catch (error) {
    window.location.href = "/login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const articleId = params.get("id");

  if (!articleId) {
    document.body.innerHTML = "<h1>Error: No se especificó una pregunta.</h1>";
    return;
  }

  try {
    const article = await fetchArticleById(articleId);
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

    commentsList.addEventListener("click", (event) => {
      const toggleBtn = event.target.closest(".options-toggle-btn");
      if (toggleBtn) {
        const dropdown = toggleBtn.nextElementSibling;
        document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
          if (d !== dropdown) d.classList.remove("visible");
        });
        dropdown.classList.toggle("visible");
      }

      const deleteBtn = event.target.closest(".delete-comment-btn");
      if (deleteBtn) {
        commentIdToDelete = deleteBtn.dataset.commentId;
        deleteConfirmModal.classList.add("visible");
        deleteBtn.closest(".options-dropdown").classList.remove("visible");
      }
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".comment-options-menu")) {
        document.querySelectorAll(".options-dropdown.visible").forEach((d) => {
          d.classList.remove("visible");
        });
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
