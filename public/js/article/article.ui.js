// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/article/article.ui.js

const askQuestionModal = document.getElementById("ask-question-modal");
const questionsList = document.getElementById("questions-list");

export const showAskQuestionModal = () => {
  if (askQuestionModal) {
    askQuestionModal.classList.add("visible");
    document.getElementById("question-content").value = ""; // Limpiar contenido
    document.getElementById("image-file").value = ""; // ⬅️ NUEVO: Limpiar input de archivo
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

const getTagColor = (tagName) => {
  const colors = {
    matemáticas: "tag-blue",
    lengua: "tag-green",
    ciencias: "tag-red",
    programación: "tag-purple",
    historia: "tag-orange",
    inglés: "tag-teal",
    castellano: "tag-violet",
    "estadísticas y cálculo": "tag-cyan",
    "ciencias sociales": "tag-brown",
    geografía: "tag-earth",
    derecho: "tag-navy",
    contabilidad: "tag-olive",
    física: "tag-sky",
    química: "tag-lime",
    salud: "tag-pink",
    biología: "tag-leaf",
    informática: "tag-steel",
    "tecnología y electrónica": "tag-electric",
    religión: "tag-gold",
    filosofía: "tag-indigo",
    psicología: "tag-salmon",
    "educ. fisica": "tag-grass",
    arte: "tag-maroon",
    musica: "tag-coral",
    francés: "tag-lightblue",
    alemán: "tag-darkred",
    "latín / griego": "tag-sand",
    "análisis de la materia y la energía": "tag-fire",
    "tratamiento de datos y azar": "tag-night",
  };
  // Usamos el nombre completo del tag en minúsculas como clave
  const key = tagName.toLowerCase();
  return colors[key] || "tag-gray"; // Default a gris si no se encuentra
};

/**
 * Rellena el selector de tags en el modal. (NUEVO)
 * @param {Array<Object>} tags - Lista de tags { _id, name }
 */
export const populateTagSelector = (tags) => {
  const tagSelect = document.getElementById("tag-select");
  if (tagSelect) {
    // Guardamos y clonamos la opción por defecto
    const defaultOption = tagSelect
      .querySelector('option[value=""]')
      .cloneNode(true);
    tagSelect.innerHTML = ""; // Limpiamos las opciones anteriores
    tagSelect.appendChild(defaultOption);

    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag._id;
      option.textContent = tag.name;
      tagSelect.appendChild(option);
    });
  }
};

// Genera el HTML para una sola tarjeta de pregunta
const renderArticleCard = (article) => {
  let authorName = "Usuario Desconocido";
  const author = article.author;

  // Lógica de autor (sin cambios)
  if (author && typeof author === "object") {
    const profile = author.profile;
    if (profile && profile.firstName && profile.lastName) {
      authorName = `${profile.firstName} ${profile.lastName}`;
    } else if (author.username) {
      authorName = author.username;
    }
  }

  const formattedDate = formatArticleDate(article.createdAt);

  // Lógica de Renderizado de Tag (NUEVO)
  const tag = article.tags && article.tags.length > 0 ? article.tags[0] : null;
  let tagHtml = "";

  if (tag && tag.name) {
    const tagColorClass = getTagColor(tag.name);
    tagHtml = `<span class="article-tag ${tagColorClass}">${tag.name}</span>`;
  }

  // ⬅️ Renderizado de la imagen
  let imageHtml = "";
  if (article.imageUrl) {
    imageHtml = `
      <div class="article-image-container">
        <a href="${article.imageUrl}" target="_blank">
          <img src="${article.imageUrl}" alt="Imagen adjunta a la pregunta" class="article-image"/>
        </a>
      </div>
    `;
  }

  return `
    <article class="article-card" data-id="${article._id}">
      <div class="article-card-header">
        <span class="article-author">${authorName}</span>
        <span class="article-date">Publicado el ${formattedDate}</span>
      </div>
      
      <div class="article-content">
        <p>${article.content}</p>
      </div>
      
      ${imageHtml} <div class="article-footer-actions">
          <div class="article-tags-container">
              ${tagHtml}
          </div>
          <div class="article-actions">
            <a href="#">Ver discusión y responder</a>
          </div>
      </div>
      
    </article>
  `;
};

// Renderiza todas las preguntas
export const loadArticles = (articles) => {
  if (questionsList) {
    if (articles.length === 0) {
      questionsList.innerHTML = `<p style="text-align: center; color: #808090; padding: 2rem;">No hay preguntas para esta asignatura. ¡Sé el primero!</p>`;
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
