// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/article/article.ui.js

const askQuestionModal = document.getElementById("ask-question-modal");
const questionsList = document.getElementById("questions-list");
const closeQuestionModalButton = document.getElementById(
  "close-question-modal"
);
const imageFileInput = document.getElementById("image-file");
const fileNameDisplay = document.getElementById("file-name-display");

export const showAskQuestionModal = () => {
  if (askQuestionModal) {
    askQuestionModal.classList.add("visible");
    document.getElementById("question-content").value = "";
    imageFileInput.value = "";
    fileNameDisplay.textContent = "Ningún archivo seleccionado";
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

/**
 * Convierte una fecha en formato ISO a un string de tiempo relativo (ej: "hace 5 minutos").
 * @param {string} dateString - La fecha en formato string (ISO 8601).
 * @returns {string} El tiempo relativo formateado.
 */
const formatRelativeTime = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const secondsElapsed = Math.floor((now - past) / 1000);

  // Menos de un minuto
  if (secondsElapsed < 60) {
    return "hace un momento";
  }

  const minutesElapsed = Math.floor(secondsElapsed / 60);
  if (minutesElapsed < 60) {
    return `hace ${minutesElapsed} minuto${minutesElapsed > 1 ? "s" : ""}`;
  }

  const hoursElapsed = Math.floor(minutesElapsed / 60);
  if (hoursElapsed < 24) {
    return `hace ${hoursElapsed} hora${hoursElapsed > 1 ? "s" : ""}`;
  }

  const daysElapsed = Math.floor(hoursElapsed / 24);
  if (daysElapsed < 7) {
    return `hace ${daysElapsed} día${daysElapsed > 1 ? "s" : ""}`;
  }

  const weeksElapsed = Math.floor(daysElapsed / 7);
  if (weeksElapsed < 4) {
    return `hace ${weeksElapsed} semana${weeksElapsed > 1 ? "s" : ""}`;
  }

  const monthsElapsed = Math.floor(daysElapsed / 30);
  if (monthsElapsed < 12) {
    return `hace ${monthsElapsed} mes${monthsElapsed > 1 ? "es" : ""}`;
  }

  const yearsElapsed = Math.floor(daysElapsed / 365);
  return `hace ${yearsElapsed} año${yearsElapsed > 1 ? "s" : ""}`;
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
  const key = tagName.toLowerCase();
  return colors[key] || "tag-gray";
};

export const populateTagSelector = (tags) => {
  const tagSelect = document.getElementById("tag-select");
  if (tagSelect) {
    const defaultOption = tagSelect
      .querySelector('option[value=""]')
      .cloneNode(true);
    tagSelect.innerHTML = "";
    tagSelect.appendChild(defaultOption);

    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag._id;
      option.textContent = tag.name;
      tagSelect.appendChild(option);
    });
  }
};

const renderArticleCard = (article) => {
  let authorName = "Usuario Desconocido";
  const author = article.author;

  if (author && typeof author === "object") {
    const profile = author.profile;
    if (profile && profile.firstName && profile.lastName) {
      authorName = `${profile.firstName} ${profile.lastName}`;
    } else if (author.username) {
      authorName = author.username;
    }
  }

  // Usamos la nueva función para obtener el tiempo relativo
  const relativeTime = formatRelativeTime(article.createdAt);

  const tag = article.tags && article.tags.length > 0 ? article.tags[0] : null;
  let tagHtml = "";

  if (tag && tag.name) {
    const tagColorClass = getTagColor(tag.name);
    tagHtml = `<span class="article-tag ${tagColorClass}">${tag.name}</span>`;
  }

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
        <span class="article-date">Publicado ${relativeTime}</span>
      </div>
      
      <div class="article-content">
        <p>${article.content}</p>
      </div>
      
      ${imageHtml}
      
      <div class="article-footer-actions">
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

export const setupCancelButton = () => {
  const cancelButton = document.getElementById("cancel-question");
  if (cancelButton) {
    cancelButton.addEventListener("click", hideAskQuestionModal);
  }

  if (closeQuestionModalButton) {
    closeQuestionModalButton.addEventListener("click", hideAskQuestionModal);
  }

  if (imageFileInput && fileNameDisplay) {
    imageFileInput.addEventListener("change", (event) => {
      const fileName =
        event.target.files.length > 0
          ? event.target.files[0].name
          : "Ningún archivo seleccionado";
      fileNameDisplay.textContent = fileName;
    });
  }
};
