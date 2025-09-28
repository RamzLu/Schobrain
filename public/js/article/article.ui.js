// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/article/article.ui.js

const askQuestionModal = document.getElementById("ask-question-modal");
const questionsList = document.getElementById("questions-list");

export const showAskQuestionModal = () => {
  if (askQuestionModal) {
    askQuestionModal.classList.add("visible");
    document.getElementById("question-content").value = ""; // Limpiar contenido
    document
      .getElementById("question-error-message")
      .classList.remove("visible");
  }
};

export const hideAskQuestionModal = () => {
  if (askQuestionModal) {
    askQuestionModal.classList.remove("visible");
  }
};

const formatArticleDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("es-ES", options);
};

// Genera el HTML para una sola tarjeta de pregunta
const renderArticleCard = (article) => {
  let authorName = "Usuario Desconocido";
  const author = article.author;

  // 1. Verificamos que el autor sea un objeto poblado
  if (author && typeof author === "object") {
    const profile = author.profile; // Obtenemos el objeto profile

    // 2. Intenta obtener el nombre y apellido si el perfil y sus campos existen
    if (profile && profile.firstName && profile.lastName) {
      authorName = `${profile.firstName} ${profile.lastName}`;
    }
    // 3. Fallback al Username
    else if (author.username) {
      authorName = author.username;
    }
  }

  const formattedDate = formatArticleDate(article.createdAt);

  return `
    <article class="article-card" data-id="${article._id}">
      <div class="article-card-header">
        <span class="article-author">${authorName}</span>
        <span class="article-date">Publicado el ${formattedDate}</span>
      </div>
      <div class="article-content">
        <p>${article.content}</p>
      </div>
      <div class="article-actions">
        <a href="#">Ver discusión y responder</a>
      </div>
    </article>
  `;
};

// Renderiza todas las preguntas
export const loadArticles = (articles) => {
  if (questionsList) {
    if (articles.length === 0) {
      questionsList.innerHTML = `<p style="text-align: center; color: #808090; padding: 2rem;">Aún no hay preguntas publicadas. ¡Sé el primero!</p>`;
      return;
    }
    const articlesHtml = articles.map(renderArticleCard).join("");
    questionsList.innerHTML = articlesHtml;
  }
};

// Cierra el modal al hacer clic en el botón de cancelar
export const setupCancelButton = () => {
  const cancelButton = document.getElementById("cancel-question");
  if (cancelButton) {
    cancelButton.addEventListener("click", hideAskQuestionModal);
  }
};
