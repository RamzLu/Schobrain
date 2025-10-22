// ... (imports y otras funciones sin cambios) ...
import { verifyAuth } from "../services/auth.service.js"; // Necesario para obtener favoritos del usuario

const askQuestionModal = document.getElementById("ask-question-modal");
const questionsList = document.getElementById("questions-list");
const closeQuestionModalButton = document.getElementById(
  "close-question-modal"
);
const imageFileInput = document.getElementById("image-files");
const fileNameDisplay = document.getElementById("file-name-display");

export const showAskQuestionModal = () => {
  if (askQuestionModal) {
    askQuestionModal.classList.add("visible");
    document.getElementById("question-content").value = "";
    if (imageFileInput) imageFileInput.value = "";
    if (fileNameDisplay)
      fileNameDisplay.textContent = "Ningún archivo seleccionado";
    document
      .getElementById("question-error-message")
      .classList.remove("visible");

    const symbolsPanel = document.getElementById("math-symbols-panel");
    if (symbolsPanel) {
      symbolsPanel.classList.remove("visible");
    }
  }
};

export const hideAskQuestionModal = () => {
  if (askQuestionModal) {
    askQuestionModal.classList.remove("visible");
  }
};

const formatRelativeTime = (dateString) => {
  // ... (sin cambios) ...
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
const getTagColor = (tagName) => {
  // ... (sin cambios) ...
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
  return colors[tagName.toLowerCase()] || "tag-gray";
};

export const populateTagSelector = (tags) => {
  // ... (sin cambios) ...
  const tagSelect = document.getElementById("tag-select");
  if (tagSelect) {
    const defaultOption = tagSelect
      .querySelector('option[value=""]')
      ?.cloneNode(true); // Manejo por si no existe
    tagSelect.innerHTML = "";
    if (defaultOption) tagSelect.appendChild(defaultOption);
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag._id;
      option.textContent = tag.name;
      tagSelect.appendChild(option);
    });
  }
};

// Modificado para aceptar `userFavorites`
export const renderArticleCard = (article, currentUser, userFavorites = []) => {
  let authorName = "Usuario Desconocido";
  let statusBadges = "";
  const author = article.author;
  const isAuthor = currentUser && currentUser.id === author?._id;
  const isAdmin = currentUser && currentUser.role === "admin";
  const canDelete = isAdmin || isAuthor;

  // NUEVO: Verifica si el artículo está en favoritos
  const isFavorite = userFavorites.includes(article._id);
  const favoriteButtonText = isFavorite
    ? "Quitar de favoritos"
    : "Añadir a favoritos";
  const favoriteButtonIcon = isFavorite ? "fas fa-star" : "far fa-star"; // Icono lleno vs vacío

  let optionsMenu = `
      <div class="article-options-menu">
        <button class="options-toggle-btn"><i class="fas fa-ellipsis-v"></i></button>
        <div class="options-dropdown">
          ${
            isAuthor
              ? `<button class="dropdown-item edit-btn" data-id="${article._id}"><i class="fas fa-edit"></i> Editar</button>`
              : ""
          }
          ${
            canDelete
              ? `<button class="dropdown-item delete-btn" data-id="${article._id}"><i class="fas fa-trash-alt"></i> Eliminar</button>`
              : ""
          }
          <button class="dropdown-item favorite-btn" data-id="${
            article._id
          }" data-is-favorite="${isFavorite}">
            <i class="${favoriteButtonIcon}"></i> ${favoriteButtonText}
          </button>
        </div>
      </div>`;

  // El resto de la lógica de renderizado (autor, fecha, tags, imágenes, votos) permanece igual
  if (author && typeof author === "object") {
    const profile = author.profile;
    authorName =
      profile && profile.firstName && profile.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : author.username || "Usuario"; // Fallback a username

    if (author.role === "admin")
      statusBadges += `<span class="admin-badge">Administrador</span>`;
    if (currentUser && currentUser.id === author._id)
      statusBadges += `<span class="author-badge">Tú</span>`;
  }

  const relativeTime = formatRelativeTime(article.createdAt);
  const tag = article.tags && article.tags.length > 0 ? article.tags[0] : null;
  let tagHtml = "";
  if (tag && tag.name) {
    const tagColorClass = getTagColor(tag.name);
    tagHtml = `<span class="article-tag ${tagColorClass}">${tag.name}</span>`;
  }

  let imagesHtml = "";
  if (article.imageUrls && article.imageUrls.length > 0) {
    const imageElements = article.imageUrls
      .map(
        (url) => `
      <a href="${url}" class="article-image-link">
        <img src="${url}" alt="Imagen de la pregunta" class="article-image"/>
      </a>`
      )
      .join("");

    imagesHtml = `<div class="article-images-gallery">${imageElements}</div>`;
  }

  const userHasLiked = currentUser && article.votedUp.includes(currentUser.id);
  const userHasDisliked =
    currentUser && article.votedDown.includes(currentUser.id);

  const voteControlsHtml = `
    <div class="vote-controls">
        <div class="vote-group">
            <button class="vote-btn like ${
              userHasLiked ? "active" : ""
            }" data-article-id="${
    article._id
  }" data-vote-type="like" title="Me gusta">
                <i class="fas fa-thumbs-up"></i>
            </button>
            <span class="vote-count like-count">${article.likes || 0}</span>
        </div>
        <div class="vote-group">
            <button class="vote-btn dislike ${
              userHasDisliked ? "active" : ""
            }" data-article-id="${
    article._id
  }" data-vote-type="dislike" title="No me gusta">
                <i class="fas fa-thumbs-down"></i>
            </button>
            <span class="vote-count dislike-count">${
              article.dislikes || 0
            }</span>
        </div>
    </div>
  `;

  return `
    <article class="article-card" data-id="${article._id}">
      <div class="article-card-header">
        <div class="author-info"><span class="article-author">${authorName}</span>${statusBadges}</div>
        <div class="header-right-controls"><span class="article-date">Publicado ${relativeTime}</span>${optionsMenu}</div>
      </div>
      <div class="article-content"><p>${article.content}</p></div>
      ${imagesHtml}
      <div class="article-footer-actions">
        <div class="footer-top-row">
            <div class="article-tags-container">${tagHtml}</div>
            <div class="article-actions"><a href="/pregunta.html?id=${article._id}">Ver discusión y responder</a></div>
        </div>
        ${voteControlsHtml}
      </div>
    </article>`;
};

// Modificado para pasar `userFavorites` a `renderArticleCard`
export const loadArticles = (articles, currentUser, userFavorites = []) => {
  if (questionsList) {
    if (!Array.isArray(articles) || articles.length === 0) {
      questionsList.innerHTML = `
        <div style="text-align: center; padding: 2rem; opacity: 0.8;">
          <p style="color: #808090; font-size: 1.2rem; margin-bottom: 1.5rem;">
            No hay preguntas para mostrar. ¡Sé el primero en preguntar!
          </p>
          <img
            src="/assets/img/errorImg.png"
            alt="No hay preguntas"
            style="max-width: 250px; width: 100%;"
          />
        </div>
      `;
      return;
    }
    questionsList.innerHTML = articles
      .map((article) => renderArticleCard(article, currentUser, userFavorites))
      .join("");
  }
};

export const setupCancelButton = () => {
  const cancelButton = document.getElementById("cancel-question");
  if (cancelButton)
    cancelButton.addEventListener("click", hideAskQuestionModal);
  if (closeQuestionModalButton)
    closeQuestionModalButton.addEventListener("click", hideAskQuestionModal);

  if (imageFileInput && fileNameDisplay) {
    imageFileInput.addEventListener("change", (event) => {
      const { files } = event.target;
      if (!files || files.length === 0) {
        fileNameDisplay.textContent = "Ningún archivo seleccionado";
      } else if (files.length === 1) {
        fileNameDisplay.textContent = files[0].name;
      } else {
        fileNameDisplay.textContent = `${files.length} archivos seleccionados`;
      }
    });
  }
};

export function initializeSymbolsPanel({
  textareaId,
  toggleBtnId,
  panelId,
  includeFunctions = false,
  fractionBtnId,
  exponentBtnId,
}) {
  const textarea = document.getElementById(textareaId);
  const toggleSymbolsBtn = document.getElementById(toggleBtnId);
  const symbolsPanel = document.getElementById(panelId);

  if (!textarea || !toggleSymbolsBtn || !symbolsPanel) return;

  const insertText = (text) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    textarea.value =
      currentText.substring(0, start) + text + currentText.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
  };

  if (includeFunctions) {
    const fractionBtn = document.getElementById(fractionBtnId);
    const exponentBtn = document.getElementById(exponentBtnId);

    if (fractionBtn) {
      fractionBtn.addEventListener("click", () => {
        const numerator = prompt("Ingresa el numerador:");
        const denominator = prompt("Ingresa el denominador:");
        if (numerator !== null && denominator !== null) {
          insertText(`(${numerator}/${denominator})`);
        }
      });
    }

    if (exponentBtn) {
      exponentBtn.addEventListener("click", () => {
        const base = prompt("Ingresa la base:");
        const exponent = prompt("Ingresa el exponente:");
        if (base !== null && exponent !== null) {
          insertText(`${base}^${exponent}`);
        }
      });
    }
  }

  const symbols = [
    "π",
    "∀",
    "≤",
    "≥",
    "∉",
    "≠",
    "∏",
    "∑",
    "¬",
    "⇔ ",
    "∧",
    "∨",
    "√",
    "∫",
    "Σ",
    "Π",
    "±",
    "≠",
    "≤",
    "≥",
    "≈",
    "∞",
    "α",
    "β",
    "γ",
    "δ",
    "θ",
    "λ",
    "μ",
    "π",
    "ω",
    "°",
    "²",
    "³",
    "₄",
    "ₓ",
  ];

  symbolsPanel.innerHTML = "";
  symbols.forEach((symbol) => {
    const span = document.createElement("span");
    span.className = "symbol-char";
    span.textContent = symbol;
    symbolsPanel.appendChild(span);
  });

  toggleSymbolsBtn.addEventListener("click", () => {
    symbolsPanel.classList.toggle("visible");
  });

  symbolsPanel.addEventListener("click", (event) => {
    if (event.target.classList.contains("symbol-char")) {
      insertText(event.target.textContent);
    }
  });
}
