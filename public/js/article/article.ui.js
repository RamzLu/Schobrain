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

export const renderArticleCard = (article, currentUser) => {
  let authorName = "Usuario Desconocido";
  let statusBadges = "";
  const author = article.author;

  const canDelete =
    currentUser &&
    (currentUser.role === "admin" || currentUser.id === author?._id);

  let optionsMenu = "";
  if (canDelete) {
    optionsMenu = `
      <div class="article-options-menu">
        <button class="options-toggle-btn"><i class="fas fa-ellipsis-v"></i></button>
        <div class="options-dropdown">
          <button class="dropdown-item delete-btn" data-id="${article._id}"><i class="fas fa-trash-alt"></i> Eliminar</button>
        </div>
      </div>`;
  }

  if (author && typeof author === "object") {
    const profile = author.profile;
    authorName =
      profile && profile.firstName && profile.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : author.username;

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

  return `
    <article class="article-card" data-id="${article._id}">
      <div class="article-card-header">
        <div class="author-info"><span class="article-author">${authorName}</span>${statusBadges}</div>
        <div class="header-right-controls"><span class="article-date">Publicado ${relativeTime}</span>${optionsMenu}</div>
      </div>
      <div class="article-content"><p>${article.content}</p></div>
      ${imagesHtml}
      <div class="article-footer-actions">
        <div class="article-tags-container">${tagHtml}</div>
        <div class="article-actions"><a href="/pregunta.html?id=${article._id}">Ver discusión y responder</a></div>
      </div>
    </article>`;
};

export const loadArticles = (articles, currentUser) => {
  if (questionsList) {
    if (articles.length === 0) {
      questionsList.innerHTML = `<p style="text-align: center; color: #808090; padding: 2rem;">No hay preguntas para esta asignatura. ¡Sé el primero!</p>`;
      return;
    }
    questionsList.innerHTML = articles
      .map((article) => renderArticleCard(article, currentUser))
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
      if (files.length === 0) {
        fileNameDisplay.textContent = "Ningún archivo seleccionado";
      } else if (files.length === 1) {
        fileNameDisplay.textContent = files[0].name;
      } else {
        fileNameDisplay.textContent = `${files.length} archivos seleccionados`;
      }
    });
  }
};

/**
 * Inicializa un panel de símbolos matemáticos para un textarea específico.
 * @param {object} config - Objeto de configuración.
 * @param {string} config.textareaId - ID del textarea.
 * @param {string} config.toggleBtnId - ID del botón para mostrar/ocultar el panel de símbolos.
 * @param {string} config.panelId - ID del div que contendrá el panel.
 * @param {boolean} [config.includeFunctions=false] - Si se deben incluir botones de funciones (fracción, exponente).
 * @param {string} [config.fractionBtnId] - ID del botón de fracción (si se incluye).
 * @param {string} [config.exponentBtnId] - ID del botón de exponente (si se incluye).
 */
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
