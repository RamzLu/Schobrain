import { verifyAuth } from "./services/auth.service.js";
import { fetchArticleById } from "./services/article.service.js";
import { postComment } from "./services/comment.service.js";
import { renderArticleCard } from "./article/article.ui.js";
import { showErrorToast } from "./utils/notifications.js";
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

const renderComments = (comments) => {
  const container = document.getElementById("comments-list");
  if (!container) return;

  if (comments.length === 0) {
    container.innerHTML =
      "<p>Aún no hay respuestas. ¡Sé el primero en responder!</p>";
    return;
  }

  container.innerHTML = comments
    .map(
      (comment) => `
        <div class="comment-card" data-id="${comment._id}">
            <div class="comment-header">
                <span class="comment-author">${
                  comment.author.profile.firstName
                } ${comment.author.profile.lastName}</span>
                <span class="comment-date">${formatRelativeTime(
                  comment.createdAt
                )}</span>
            </div>
            <div class="comment-content">
                <p>${comment.content}</p>
            </div>
        </div>
    `
    )
    .join("");
};

document.addEventListener("DOMContentLoaded", async () => {
  let currentUser;
  try {
    const authData = await verifyAuth();
    currentUser = authData.data;
    const usernameSpan = document.getElementById("logged-in-username");
    if (usernameSpan) {
      usernameSpan.textContent = currentUser.firstName;
    }
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
    renderComments(article.comments);

    initializeLightbox("main-question-container");

    const commentForm = document.getElementById("comment-form");
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = e.target.content.value.trim();
      if (content.length < 5) {
        showErrorToast("La respuesta debe tener al menos 5 caracteres.");
        return;
      }

      const commentData = {
        content,
        author: currentUser.id,
        article: articleId,
      };

      try {
        await postComment(commentData);
        window.location.reload();
      } catch (error) {
        showErrorToast(`Error al publicar tu respuesta: ${error.message}`);
      }
    });
  } catch (error) {
    document.body.innerHTML = `<h1>Error al cargar la pregunta: ${error.message}</h1>`;
  }
});
