// public/js/article/article.ui.js
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

// Modificamos la firma para aceptar un objeto 'options'
export const renderArticleCard = (
  article,
  currentUser,
  userFavorites = [],
  options = {} // Objeto de opciones, por defecto vacío
) => {
  const author = article.author;
  let authorId = null;
  let authorName = "Usuario Desconocido";
  let statusBadges = "";
  let avatarHtml = "";
  let verifiedBadge = ""; // Icono de verificado

  // Lógica de autor (corregida)
  if (author && typeof author === "object") {
    authorId = author._id;
    authorName = author.username || "Usuario Desconocido";

    const defaultAvatarName =
      author.username || author.profile?.firstName || "NN";
    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      defaultAvatarName
    )}&background=random`;
    const avatarUrl = author.profile?.avatarUrl || defaultAvatarUrl;
    avatarHtml = `<img src="${avatarUrl}" alt="Avatar" class="author-avatar" loading="lazy"/>`;

    if (author.role === "admin") {
      statusBadges += `<span class="admin-badge">Administrador</span>`;
    }

    // === LÓGICA PARA ICONO DE VERIFICADO ===
    if (author.teacherStatus === "verified") {
      verifiedBadge = `<i class="fas fa-check-circle" style="color: #27ae60; margin-left: 5px;" title="Docente Verificado"></i>`;
    }
  } else if (author && typeof author === "string") {
    authorId = author;
    authorName = currentUser.username || "Usuario";

    const defaultAvatarName =
      currentUser.username || currentUser.firstName || "NN";
    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      defaultAvatarName
    )}&background=random`;
    const avatarUrl =
      (currentUser.profile && currentUser.profile.avatarUrl) ||
      currentUser.avatarUrl ||
      defaultAvatarUrl;
    avatarHtml = `<img src="${avatarUrl}" alt="Avatar" class="author-avatar" loading="lazy"/>`;

    // Si el usuario actual es verificado y es el autor (caso raro en renderizado de lista, pero posible)
    if (currentUser.teacherStatus === "verified") {
      verifiedBadge = `<i class="fas fa-check-circle" style="color: #27ae60; margin-left: 5px;" title="Docente Verificado"></i>`;
    }
  }

  const isAuthor = currentUser && currentUser.id === authorId;
  const isAdmin = currentUser && currentUser.role === "admin";
  const canDelete = isAdmin || isAuthor;

  if (isAuthor && !statusBadges.includes("admin-badge")) {
    statusBadges += `<span class="author-badge">Tú</span>`;
  }

  // --- INICIO DE LA MODIFICACIÓN (Enlaces de autor) ---

  // 1. Crear el enlace del autor
  // Si es el autor, el enlace va a perfil.html. Si es otro usuario, va a usuario.html.
  const authorLinkHref = isAuthor
    ? "/perfil.html"
    : `/usuario.html?id=${authorId}`;

  // 2. Envolvemos el avatar y el nombre en el enlace
  // AÑADIDO: verifiedBadge dentro del span del nombre
  const authorInfoHtml = `
    <a href="${authorLinkHref}" class="author-link">
      ${avatarHtml}
      <div class="author-text-group">
          <span class="article-author">${authorName}${verifiedBadge}</span>
          ${statusBadges}
      </div>
    </a>
  `;
  // --- FIN DE LA MODIFICACIÓN ---

  // Lógica para mostrar/ocultar el menú de 3 puntos
  let headerControls = "";
  const isFavoriteCard = article.isFavoriteCard === true;

  if (options.isMyContent) {
    headerControls = "";
  } else if (isFavoriteCard) {
    headerControls = `
        <div class="article-options-menu">
            <span class="favorite-remove-star" data-article-id="${article._id}" title="Quitar de favoritos">
                <i class="fas fa-star"></i>
            </span>
        </div>
    `;
  } else {
    // VISTA: Feed (index.html) -> Mostrar menú de 3 puntos
    const isFavorite = userFavorites.includes(article._id);
    const favoriteButtonText = isFavorite
      ? "Quitar de favoritos"
      : "Añadir a favoritos";
    const favoriteButtonIcon = isFavorite ? "fas fa-star" : "far fa-star";

    headerControls = `
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

  // === INICIO DE LA MODIFICACIÓN (Ocultar enlace en página de detalle) ===
  let articleActionsHtml = "";
  // Si la opción 'isDetailPage' (pasada desde pregunta.js) es true, no renderiza el enlace
  if (!options.isDetailPage) {
    articleActionsHtml = `
      <div class="article-actions">
          <a href="/pregunta.html?id=${article._id}">
              ${
                options.isMyContent
                  ? "Ver mi pregunta"
                  : "Ver discusión y responder"
              }
          </a>
      </div>
    `;
  }
  // === FIN DE LA MODIFICACIÓN ===

  return `
    <article class="article-card" data-id="${article._id}">
      <div class="article-card-header">
        <div class="author-info">
            ${authorInfoHtml}
        </div>
        <div class="header-right-controls"><span class="article-date">Publicado ${relativeTime}</span>${headerControls}</div>
      </div>
      <div class="article-content"><p>${article.content}</p></div>
      ${imagesHtml}
      <div class="article-footer-actions">
        <div class="footer-top-row">
            <div class="article-tags-container">${tagHtml}</div>
            ${articleActionsHtml}
        </div>
        ${voteControlsHtml}
      </div>
    </article>`;
};

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
    // No se necesita cambiar nada aquí, porque el 'options' por defecto
    // (vacío) funcionará bien para el feed (index.html).
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
}) {
  // === INICIO MODIFICACIÓN: Aceptar elementos DOM o IDs de string ===
  const textarea =
    typeof textareaId === "string"
      ? document.getElementById(textareaId)
      : textareaId;
  const toggleSymbolsBtn =
    typeof toggleBtnId === "string"
      ? document.getElementById(toggleBtnId)
      : toggleBtnId;
  const symbolsPanel =
    typeof panelId === "string" ? document.getElementById(panelId) : panelId;
  // === FIN MODIFICACIÓN ===

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
    "¹",
    "²",
    "³",
    "⁴",
    "⁵",
    "⁶",
    "⁷",
    "⁸",
    "⁹",
    "ⁿ",
    "ª",
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
