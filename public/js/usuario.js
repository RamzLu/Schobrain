// public/js/usuario.js
import { verifyAuth } from "./services/auth.service.js";
import { fetchPublicUserProfile } from "./services/user.service.js";
import { renderArticleCard } from "./article/article.ui.js"; // Reutilizamos el renderizador
import { initializeLightbox } from "./utils/lightbox.js";
import { showErrorToast } from "./utils/notifications.js";

// --- Funciones copiadas de perfil.js (para renderizar respuestas) ---

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

const renderUserCommentCard = (comment) => {
  const relativeTime = formatRelativeTime(comment.createdAt);
  const articleContentSnippet =
    comment.article.content.substring(0, 80) + "...";

  // Usar la info del autor que viene populada
  const authorName = comment.author.username || "Usuario";
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    authorName
  )}&background=random`;
  const avatarUrl = comment.author.profile?.avatarUrl || defaultAvatarUrl;
  const avatarHtml = `<img src="${avatarUrl}" alt="Avatar" class="author-avatar comment-avatar" loading="lazy"/>`;

  let imagesHtml = "";
  if (comment.imageUrls && comment.imageUrls.length > 0) {
    const imageElements = comment.imageUrls
      .map(
        (url) => `
      <a href="${url}" class="article-image-link">
        <img src="${url}" alt="Imagen de la respuesta" class="article-image"/>
      </a>`
      )
      .join("");
    imagesHtml = `<div class="article-images-gallery">${imageElements}</div>`;
  }

  return `
    <div class="comment-favorite-card my-comment-card" data-id="${comment._id}">
      <div class="comment-header">
        <div class="comment-author-info">
          ${avatarHtml}
          <div class="author-text-group">
              <span class="comment-author">${authorName}</span>
              <span class="comment-date">Publicada ${relativeTime}</span>
          </div>
        </div>
      </div>
      <div class="comment-content">
        <p>${comment.content}</p>
      </div>
      ${imagesHtml}
      <div class="comment-metadata">
        <span>En respuesta a: </span>
        <a href="/pregunta.html?id=${comment.article._id}" class="metadata-link" title="${comment.article.content}">
            ${articleContentSnippet}
        </a>
      </div>
    </div>
  `;
};

// --- Fin de funciones copiadas ---

/**
 * Carga el contenido (preguntas o respuestas) en la lista
 */
const loadContent = (type, articles, comments, currentUser, userFavorites) => {
  const contentListContainer = document.getElementById("user-content-list");

  // Actualizar botones de filtro
  document
    .getElementById("filter-articles-btn")
    .classList.toggle("active", type === "articles");
  document
    .getElementById("filter-comments-btn")
    .classList.toggle("active", type === "comments");

  if (type === "articles") {
    if (articles.length === 0) {
      contentListContainer.innerHTML =
        "<p>Este usuario aún no ha hecho preguntas.</p>";
      return;
    }
    contentListContainer.innerHTML = articles
      .map((article) =>
        // AHORA ESTO FUNCIONARÁ, porque el backend envía el objeto author completo
        renderArticleCard(article, currentUser, userFavorites)
      )
      .join("");
  } else {
    if (comments.length === 0) {
      contentListContainer.innerHTML =
        "<p>Este usuario aún no ha publicado respuestas.</p>";
      return;
    }
    contentListContainer.innerHTML = comments
      .map(renderUserCommentCard)
      .join("");
  }

  // Activar el lightbox para las imágenes
  initializeLightbox("user-content-list");
};

/**
 * Rellena la tarjeta de perfil
 */
const renderProfileCard = (user) => {
  const { profile, username, role, teacherStatus } = user; // Destructuramos teacherStatus
  document.getElementById("firstName").textContent =
    profile.firstName || "Nombre";
  document.getElementById("lastName").textContent =
    profile.lastName || "Apellido";
  document.getElementById("username").textContent = `@${
    username || "username"
  }`;

  // === INICIO MODIFICACIÓN: Badge de Profesor ===
  const roleElement = document.getElementById("role");
  if (teacherStatus === "verified") {
    roleElement.innerHTML =
      '<i class="fas fa-chalkboard-teacher"></i> Profesor Verificado <i class="fas fa-check-circle" style="color: #27ae60; margin-left: 4px;"></i>';
    roleElement.style.backgroundColor = "#e8f5e9";
    roleElement.style.color = "#27ae60";
    roleElement.style.border = "1px solid #27ae60";
  } else {
    roleElement.textContent = role || "Usuario";
  }
  // === FIN MODIFICACIÓN ===

  document.getElementById("biography-display").textContent =
    profile.biography || "No hay biografía disponible.";

  const birthDate = profile.birthDate
    ? new Date(profile.birthDate + "T00:00:00")
    : null;
  document.getElementById("birthdate-display").textContent = birthDate
    ? birthDate.toLocaleDateString("es-ES", { timeZone: "UTC" })
    : "No especificada.";

  const avatarDisplay = document.getElementById("avatarUrl");
  avatarDisplay.src =
    profile.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile.firstName || "NN"
    )}+${encodeURIComponent(profile.lastName || "")}&background=random`;

  // === BANNER ===
  const bannerDisplay = document.getElementById("bannerUrl");
  if (
    profile.bannerUrl &&
    profile.bannerUrl !== "assets/img/default-banner.png"
  ) {
    bannerDisplay.src = profile.bannerUrl;
  } else {
    // Fallback si es la default
    bannerDisplay.src =
      "https://via.placeholder.com/1200x400/e0e7ff/4338ca?text=Schobrain";
  }
};

/**
 * Rellena la tarjeta de estadísticas
 */
const renderStatsCard = (articlesCount, commentsCount) => {
  document.getElementById("article-count-display").textContent = articlesCount;
  document.getElementById("comment-count-display").textContent = commentsCount;
};

/**
 * Función Principal
 */
document.addEventListener("DOMContentLoaded", async () => {
  let currentUser = null;
  let userFavorites = [];

  try {
    // Verificamos si hay un usuario logueado (para los likes, etc.)
    const authData = await verifyAuth();
    currentUser = authData.data;
    document.getElementById("logged-in-username").textContent =
      currentUser.firstName;
  } catch (error) {
    // No está logueado, ocultamos el saludo
    document.querySelector(".header-right").style.display = "none";
  }

  // 1. Obtener el ID del usuario de la URL
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("id");

  if (!userId) {
    document.body.innerHTML = "<h1>Error: No se especificó un usuario.</h1>";
    return;
  }

  try {
    // 2. Cargar los datos del perfil público
    const userProfile = await fetchPublicUserProfile(userId);
    const { articles = [], comments = [] } = userProfile;

    // 3. Renderizar todo
    renderProfileCard(userProfile);
    renderStatsCard(articles.length, comments.length);
    loadContent("articles", articles, comments, currentUser, userFavorites);

    // 4. Añadir listeners a los botones de filtro
    document
      .getElementById("filter-articles-btn")
      .addEventListener("click", () =>
        loadContent("articles", articles, comments, currentUser, userFavorites)
      );

    document
      .getElementById("filter-comments-btn")
      .addEventListener("click", () =>
        loadContent("comments", articles, comments, currentUser, userFavorites)
      );
  } catch (error) {
    showErrorToast(error.message);
    document.getElementById(
      "public-profile-section"
    ).innerHTML = `<h2>Error al cargar perfil</h2><p>${error.message}</p>`;
  }
});
