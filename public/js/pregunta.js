import { verifyAuth } from "./services/auth.service.js";
import { fetchArticleById } from "./services/article.service.js";
import { postComment } from "./services/comment.service.js";
import { renderArticleCard } from "./article/article.ui.js"; // Reutilizamos el renderizador

// --- Renderizadores específicos para esta página ---

const renderMainQuestion = (article, currentUser) => {
  const container = document.getElementById("main-question-container");
  if (container) {
    // Reutilizamos la función de renderizado de tarjetas pero sin el enlace de "responder"
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
                <span class="comment-date">· ${new Date(
                  comment.createdAt
                ).toLocaleDateString()}</span>
            </div>
            <div class="comment-content">
                <p>${comment.content}</p>
            </div>
        </div>
    `
    )
    .join("");
};

// --- Lógica principal de la página ---

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

  // Obtener el ID del artículo de la URL
  const params = new URLSearchParams(window.location.search);
  const articleId = params.get("id");

  if (!articleId) {
    document.body.innerHTML = "<h1>Error: No se especificó una pregunta.</h1>";
    return;
  }

  try {
    // Cargar el artículo y sus comentarios
    const article = await fetchArticleById(articleId);

    // Renderizar la pregunta principal y los comentarios
    renderMainQuestion(article, currentUser);
    renderComments(article.comments);

    // Manejar el formulario de nuevo comentario
    const commentForm = document.getElementById("comment-form");
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = e.target.content.value.trim();
      if (content.length < 5) {
        alert("La respuesta debe tener al menos 5 caracteres.");
        return;
      }

      const commentData = {
        content,
        author: currentUser.id,
        article: articleId,
      };

      try {
        await postComment(commentData);
        window.location.reload(); // Recargamos para ver el nuevo comentario
      } catch (error) {
        alert(`Error al publicar tu respuesta: ${error.message}`);
      }
    });
  } catch (error) {
    document.body.innerHTML = `<h1>Error al cargar la pregunta: ${error.message}</h1>`;
  }
});
