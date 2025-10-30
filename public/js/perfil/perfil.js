// public/js/perfil/perfil.js
import {
  verifyAuth,
  logoutUser,
  deleteAccount,
} from "../services/auth.service.js";
import {
  getProfile,
  updateProfileData,
  updateAccountData,
  updateAvatarImage,
  getFavoriteArticles,
  getFavoriteComments,
  toggleFavoriteComment,
} from "../services/profile.service.js";
import {
  getMyArticles, // <<-- NUEVA IMPORTACIÓN
  deleteArticle, // <<-- IMPORTADO PARA ELIMINACIÓN
} from "../services/article.service.js";
import {
  getMyComments, // <<-- NUEVA IMPORTACIÓN
  deleteComment, // <<-- IMPORTADO PARA ELIMINACIÓN
} from "../services/comment.service.js";
import { showSuccessToast, showErrorToast } from "../utils/notifications.js";
import { renderArticleCard } from "../article/article.ui.js";
import { initializeLightbox } from "../utils/lightbox.js";

// Helper para el formato de tiempo (necesario para el renderizado del comentario)
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

// FUNCIÓN para renderizar una tarjeta de comentario favorito
const renderFavoriteCommentCard = (comment) => {
  // FIX 1: Usar username en lugar de nombre y apellido
  const authorName = comment.author.username || "Usuario Desconocido";

  // FIX 2: Construir HTML del avatar
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    comment.author.username || "NN"
  )}&background=random`;
  const avatarUrl = comment.author.profile?.avatarUrl || defaultAvatarUrl;
  const avatarHtml = `<img src="${avatarUrl}" alt="Avatar" class="author-avatar comment-avatar" loading="lazy"/>`;
  // FIN FIX 2

  // El backend de favoritos popula article.content
  const articleContentSnippet =
    comment.article.content.substring(0, 80) + "...";
  const relativeTime = formatRelativeTime(comment.createdAt);

  return `
    <div class="comment-favorite-card" data-id="${comment._id}">
      <div class="comment-header">
        <div class="comment-author-info">
          ${avatarHtml}
          <div class="author-text-group">
              <span class="comment-author">${authorName}</span>
              <span class="comment-date">Respuesta publicada ${relativeTime}</span>
          </div>
        </div>
        <button 
            class="favorite-remove-btn" 
            data-comment-id="${comment._id}" 
            title="Quitar de favoritos"
        >
            <i class="fas fa-star"></i>
        </button>
      </div>
      <div class="comment-content">
        <p>${comment.content}</p>
      </div>
      <div class="comment-metadata">
        <span>Respuesta a la pregunta: </span>
        <a href="/pregunta.html?id=${comment.article._id}" class="metadata-link" title="${comment.article.content}">
            ${articleContentSnippet}
        </a>
      </div>
    </div>
  `;
};

// NUEVA FUNCIÓN para renderizar una tarjeta de comentario propio (TAREA 1)
const renderMyCommentCard = (comment) => {
  // Aquí no tenemos los datos del autor (nosotros mismos) ni del artículo populados
  const relativeTime = formatRelativeTime(comment.createdAt);
  const articleLink = `/pregunta.html?id=${comment.article}`;

  return `
    <div class="comment-favorite-card my-comment-card" data-id="${comment._id}" style="border-left: 4px solid #2575fc;">
      <div class="comment-header">
        <div class="comment-author-info">
          <div class="author-text-group">
              <span class="comment-author">Tu Respuesta</span>
              <span class="comment-date">Publicada ${relativeTime}</span>
          </div>
        </div>
        <button 
            class="delete-my-comment-btn favorite-remove-btn danger-zone-button" 
            data-comment-id="${comment._id}" 
            title="Eliminar respuesta"
        >
            <i class="fas fa-trash-alt"></i> Eliminar
        </button>
      </div>
      <div class="comment-content">
        <p>${comment.content}</p>
      </div>
      <div class="comment-metadata">
        <i class="fas fa-link"></i>
        <a href="${articleLink}" class="metadata-link">
            Ver pregunta original
        </a>
      </div>
    </div>
  `;
};

// Variable para almacenar el estado del filtro de contenido
let currentMyContentType = "my-articles";

// FUNCIÓN PRINCIPAL para cargar y mostrar el contenido propio (TAREA 1)
const loadMyContent = async (
  filterType = currentMyContentType,
  currentUser
) => {
  const contentListContainer = document.getElementById("my-content-list");
  if (!contentListContainer) return;

  contentListContainer.innerHTML = "<p>Cargando tu contenido...</p>";

  // Actualizar el estado visual del filtro
  const filterButtons = document.querySelectorAll(
    "#my-content-section .favorites-filter-btn"
  );
  filterButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.filterType === filterType) {
      btn.classList.add("active");
    }
  });

  currentMyContentType = filterType; // Actualiza el estado

  try {
    let items = [];
    let emptyMessage = "";
    const userFavorites = currentUser.favorites || []; // Necesario para renderArticleCard

    if (filterType === "my-articles") {
      // Usar servicio para obtener mis artículos
      const response = await getMyArticles();
      items = response;
      emptyMessage = "Aún no has publicado ninguna pregunta.";

      // Renderizar artículos.
      // renderArticleCard necesita el autor poblado, y getMyArticles lo devuelve (revisado en el backend).
      const articlesToRender = items.map((article) => ({
        ...article,
        // Al ser mis artículos, se asegura que el menú de 3 puntos contenga Editar/Eliminar.
      }));

      const contentHtml = articlesToRender
        .map((article) =>
          renderArticleCard(article, currentUser, userFavorites)
        )
        .join("");

      contentListContainer.innerHTML = contentHtml;
      // Inicializa lightbox solo para artículos
      initializeLightbox("my-content-list");
    } else if (filterType === "my-comments") {
      // Usar servicio para obtener mis comentarios
      const response = await getMyComments();
      items = response;
      emptyMessage = "Aún no has publicado ninguna respuesta.";

      // Renderizar comentarios propios
      const contentHtml = items.map(renderMyCommentCard).join("");

      contentListContainer.innerHTML = contentHtml;
    }

    if (items.length === 0) {
      contentListContainer.innerHTML = `<p>${emptyMessage}</p>`;
    }
  } catch (error) {
    console.error(`Error al cargar ${filterType}:`, error);
    showErrorToast(`Error al cargar tu contenido: ${error.message}`);
    contentListContainer.innerHTML =
      "<p>Ocurrió un error al cargar tu contenido.</p>";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  let currentUser;
  let fullProfileData = null; // Almacenará favorites y favoriteComments
  let currentFilterType = "articles"; // Estado inicial del filtro: preguntas

  try {
    const authData = await verifyAuth();
    // Aseguramos que currentUser contenga la info necesaria para renderArticleCard
    currentUser = authData.data;
    document.getElementById("logged-in-username").textContent =
      currentUser.firstName;
  } catch (error) {
    // TAREA 3: Asegurar flujo de autenticación robusto
    window.location.href = "/login.html";
    return;
  }

  // --- Elementos Comunes ---
  const logoutBtnPerfil = document.getElementById("logout-btn-perfil");
  const logoutModal = document.getElementById("logout-modal");
  const cancelLogoutBtn = document.getElementById("cancel-logout");
  const confirmLogoutBtn = document.getElementById("confirm-logout");
  const navLinks = document.querySelectorAll(".profile-nav .nav-link");

  // --- Elementos de Perfil ---
  const profileSection = document.getElementById("profile-section");
  const profileOptionsMenu = profileSection?.querySelector(
    ".profile-options-menu"
  );
  const profileOptionsToggleBtn = profileOptionsMenu?.querySelector(
    ".options-toggle-btn"
  );
  const profileOptionsDropdown =
    profileOptionsMenu?.querySelector(".profile-dropdown");
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const profileModal = document.getElementById("edit-profile-modal");
  const cancelProfileBtn = document.getElementById("cancel-edit-btn");
  const editProfileForm = document.getElementById("edit-profile-form");
  const avatarWrapper = document.getElementById("avatar-wrapper");
  const avatarInput = document.getElementById("avatar-input");
  const avatarDisplay = document.getElementById("avatarUrl");

  // --- Elementos de Cuenta ---
  const accountSection = document.getElementById("account-section");
  const accountOptionsMenu = accountSection?.querySelector(
    ".account-options-menu"
  );
  const accountOptionsToggleBtn = accountOptionsMenu?.querySelector(
    ".account-options-toggle"
  );
  const accountOptionsDropdown =
    accountOptionsMenu?.querySelector(".account-dropdown");
  const editAccountBtn = document.getElementById("edit-account-btn");
  const accountModal = document.getElementById("edit-account-modal");
  const cancelAccountBtn = document.getElementById("cancel-edit-account-btn");
  const editAccountForm = document.getElementById("edit-account-form");

  // --- Elementos de Zona de Peligro ---
  const deleteAccountBtn = document.getElementById("delete-account-btn");
  const deleteAccountModal = document.getElementById("delete-account-modal");
  const cancelDeleteAccountBtn = document.getElementById(
    "cancel-delete-account-btn"
  );
  const confirmDeleteAccountBtn = document.getElementById(
    "confirm-delete-account-btn"
  );
  const deleteConfirmPasswordInput = document.getElementById(
    "delete-confirm-password"
  );

  // --- NUEVOS ELEMENTOS PARA FAVORITOS ---
  const favoritesListContainer = document.getElementById("favorites-list");
  const filterButtons = document.querySelectorAll(
    "#favorites-section .favorites-filter-btn"
  );

  // --- NUEVOS ELEMENTOS PARA MI CONTENIDO ---
  const myContentListContainer = document.getElementById("my-content-list");
  const myContentFilterButtons = document.querySelectorAll(
    "#my-content-section .favorites-filter-btn"
  );

  // --- Funciones ---
  const setProfileFields = (data) => {
    const { profile, email, username, role } = data;
    // Perfil
    document.getElementById("firstName").textContent =
      profile.firstName || "Nombre";
    document.getElementById("lastName").textContent =
      profile.lastName || "Apellido";
    document.getElementById("username").textContent = `@${
      username || "username"
    }`;
    avatarDisplay.src =
      profile.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        profile.firstName || "NN"
      )}+${encodeURIComponent(profile.lastName || "")}&background=random`;
    document.getElementById("role").textContent = role || "Usuario";
    document.getElementById("biography-display").textContent =
      profile.biography || "No has añadido una biografía.";
    // Formatear fecha si existe
    const birthDate = profile.birthDate
      ? new Date(profile.birthDate + "T00:00:00")
      : null; // Asegura que se interprete como local
    document.getElementById("birthdate-display").textContent = birthDate
      ? birthDate.toLocaleDateString("es-ES", { timeZone: "UTC" }) // Usa UTC para evitar desfasajes
      : "No especificada.";

    // Cuenta
    document.getElementById("email-display").textContent = email || "";
  };

  const fetchProfile = async () => {
    try {
      const data = await getProfile(); // Usa la función del servicio
      fullProfileData = data;
      setProfileFields(data);
      // TAREA 3: Asegura que currentUser tiene los favoritos actualizados
      currentUser.favorites = data.favorites || [];
      currentUser.favoriteComments = data.favoriteComments || [];
    } catch (err) {
      showErrorToast(`Error al cargar datos: ${err.message}`);
    }
  };

  // FUNCIÓN PRINCIPAL para cargar y mostrar favoritos (adaptada)
  const loadFavorites = async (filterType = currentFilterType) => {
    if (!favoritesListContainer) return;
    favoritesListContainer.innerHTML = "<p>Cargando favoritos...</p>";

    // Actualizar el estado visual del filtro
    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.filterType === filterType) {
        btn.classList.add("active");
      }
    });

    currentFilterType = filterType; // Actualiza el estado

    try {
      let items = [];
      let emptyMessage = "";

      if (filterType === "articles") {
        items = await getFavoriteArticles();
        emptyMessage = "Aún no has añadido ninguna pregunta a favoritos.";
      } else if (filterType === "comments") {
        items = await getFavoriteComments();
        emptyMessage = "Aún no has añadido ninguna respuesta a favoritos.";
      }

      if (items.length === 0) {
        favoritesListContainer.innerHTML = `<p>${emptyMessage}</p>`;
        return;
      }

      let contentHtml = "";

      // Usamos la lista de IDs de favoritos del perfil completo
      const articleFavorites = fullProfileData?.favorites || [];

      if (filterType === "articles") {
        // FIX: Se modifica el array de artículos para añadir la propiedad
        // que fuerza el renderizado del botón de estrella de eliminación.
        const articlesToRender = items.map((article) => ({
          ...article,
          isFavoriteCard: true, // Indica a renderArticleCard que es una tarjeta de favorito para el perfil
        }));

        // Asegúrate de que currentUser tiene al menos el id para el renderizado interno
        contentHtml = articlesToRender
          .map((article) =>
            renderArticleCard(article, currentUser, articleFavorites)
          )
          .join("");
        favoritesListContainer.innerHTML = contentHtml;
        // Inicializa lightbox solo para artículos
        initializeLightbox("favorites-list");
      } else if (filterType === "comments") {
        contentHtml = items
          .map((comment) => renderFavoriteCommentCard(comment))
          .join("");
        favoritesListContainer.innerHTML = contentHtml;
      }
    } catch (error) {
      console.error(`Error al cargar ${filterType} favoritos:`, error);
      showErrorToast(`Error al cargar favoritos: ${error.message}`);
      favoritesListContainer.innerHTML =
        "<p>Ocurrió un error al cargar tus favoritos.</p>";
    }
  };

  // Función para cambiar la sección visible
  const switchSection = (sectionId) => {
    document.querySelectorAll(".profile-content").forEach((section) => {
      section.classList.remove("active-section");
    });
    const sectionToShow = document.getElementById(`${sectionId}-section`);
    if (sectionToShow) {
      sectionToShow.classList.add("active-section");
    }
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.section === sectionId);
    });

    // Lógica para cargar contenido basado en la sección
    if (sectionId === "favorites") {
      // Asegura que los botones de filtro se muestren en el estado correcto al entrar en la sección
      document
        .getElementById("filter-articles-btn")
        ?.classList.toggle("active", currentFilterType === "articles");
      document
        .getElementById("filter-comments-btn")
        ?.classList.toggle("active", currentFilterType === "comments");
      loadFavorites(currentFilterType);
    } else if (sectionId === "my-content") {
      // Lógica para la nueva sección
      document
        .getElementById("filter-my-articles-btn")
        ?.classList.toggle("active", currentMyContentType === "my-articles");
      document
        .getElementById("filter-my-comments-btn")
        ?.classList.toggle("active", currentMyContentType === "my-comments");
      loadMyContent(currentMyContentType, currentUser);
    }
  };

  // --- Event Listeners ---

  // Navegación entre secciones
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = e.target.closest("a").dataset.section;
      switchSection(section);
    });
  });

  // Listener para los nuevos botones de filtro de FAVORITOS
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const filterType = btn.dataset.filterType;
      loadFavorites(filterType);
    });
  });

  // Listener para los nuevos botones de filtro de MI CONTENIDO
  myContentFilterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const filterType = btn.dataset.filterType;
      loadMyContent(filterType, currentUser);
    });
  });

  // Listener para quitar favoritos (artículos y comentarios) desde la vista de favoritos
  favoritesListContainer.addEventListener("click", async (event) => {
    const removeCommentBtn = event.target.closest(".favorite-remove-btn");
    const removeArticleStar = event.target.closest(".favorite-remove-star");

    if (!removeCommentBtn && !removeArticleStar) return; // Salir si no es un botón de remoción

    // Lógica para quitar COMENTARIO de favoritos
    if (removeCommentBtn && currentFilterType === "comments") {
      const commentId = removeCommentBtn.dataset.commentId;

      try {
        const result = await toggleFavoriteComment(commentId);
        showSuccessToast(result.message);
        // Actualizar la lista de favoritos en el perfil local
        if (fullProfileData) {
          fullProfileData.favoriteComments = result.favoriteComments;
        }
        // Recargar solo la lista de comentarios favoritos
        await loadFavorites("comments");
      } catch (error) {
        showErrorToast(error.message);
      }
    }
    // Lógica para quitar ARTÍCULO de favoritos
    else if (removeArticleStar && currentFilterType === "articles") {
      // El ID del artículo está ahora en data-article-id en el span de estrella
      const articleId = removeArticleStar.dataset.articleId;

      const { toggleFavoriteArticle } = await import(
        "../services/article.service.js"
      );
      try {
        const result = await toggleFavoriteArticle(articleId);
        showSuccessToast(result.message);
        // Actualizar la lista de favoritos en el perfil local
        if (fullProfileData) {
          fullProfileData.favorites = result.favorites;
        }
        // Recargar solo la lista de artículos favoritos
        await loadFavorites("articles");
      } catch (error) {
        showErrorToast(error.message);
      }
    }

    // Lógica para el lightbox (debe reiniciarse si se carga una nueva tarjeta con imágenes)
    const link = event.target.closest(".article-image-link");
    if (link && currentFilterType === "articles") {
      // Simula el clic para el lightbox
      const modal = document.getElementById("image-preview-modal");
      const previewImage = document.getElementById("preview-image-src");
      if (modal && previewImage) {
        event.preventDefault();
        previewImage.src = link.href;
        modal.classList.add("visible");
      }
    }
  });

  // TAREA 2: Listener para el botón de eliminar contenido propio
  myContentListContainer.addEventListener("click", async (event) => {
    // 1. Eliminar Artículo Propio
    const deleteArticleBtn = event.target.closest(".delete-btn"); // Los artículos usan .delete-btn
    if (deleteArticleBtn && currentMyContentType === "my-articles") {
      const articleId = deleteArticleBtn.dataset.id;
      const confirmDelete = window.confirm(
        "¿Estás seguro de eliminar esta pregunta? Esta acción es permanente."
      );
      if (confirmDelete) {
        try {
          await deleteArticle(articleId); // Servicio de article.service.js
          showSuccessToast("Pregunta eliminada correctamente.");
          // Recargar lista
          await loadMyContent("my-articles", currentUser);
        } catch (error) {
          showErrorToast(`Error al eliminar la pregunta: ${error.message}`);
        }
      }
      return;
    }

    // 2. Eliminar Comentario Propio
    const deleteCommentBtn = event.target.closest(".delete-my-comment-btn");
    if (deleteCommentBtn && currentMyContentType === "my-comments") {
      const commentId = deleteCommentBtn.dataset.commentId;
      const confirmDelete = window.confirm(
        "¿Estás seguro de eliminar esta respuesta? Esta acción es permanente."
      );
      if (confirmDelete) {
        try {
          await deleteComment(commentId); // Servicio de comment.service.js
          showSuccessToast("Respuesta eliminada correctamente.");
          // Recargar lista
          await loadMyContent("my-comments", currentUser);
        } catch (error) {
          showErrorToast(`Error al eliminar la respuesta: ${error.message}`);
        }
      }
      return;
    }

    // 3. Lógica para el lightbox (solo para artículos, ya que los comentarios no tienen imágenes)
    const link = event.target.closest(".article-image-link");
    if (link && currentMyContentType === "my-articles") {
      // Simula el clic para el lightbox
      const modal = document.getElementById("image-preview-modal");
      const previewImage = document.getElementById("preview-image-src");
      if (modal && previewImage) {
        event.preventDefault();
        previewImage.src = link.href;
        modal.classList.add("visible");
      }
    }
  });

  // --- Menús Opciones (Perfil y Cuenta) ---
  if (profileOptionsToggleBtn) {
    profileOptionsToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileOptionsDropdown?.classList.toggle("visible");
      accountOptionsDropdown?.classList.remove("visible"); // Cierra el otro
    });
  }
  if (accountOptionsToggleBtn) {
    accountOptionsToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      accountOptionsDropdown?.classList.toggle("visible");
      profileOptionsDropdown?.classList.remove("visible"); // Cierra el otro
    });
  }
  // Cerrar menús al hacer clic fuera
  document.addEventListener("click", (event) => {
    if (!profileOptionsMenu?.contains(event.target)) {
      profileOptionsDropdown?.classList.remove("visible");
    }
    if (!accountOptionsMenu?.contains(event.target)) {
      accountOptionsDropdown?.classList.remove("visible");
    }
  });

  // --- Botón Logout ---
  logoutBtnPerfil?.addEventListener("click", () => {
    logoutModal?.classList.add("visible");
    profileOptionsDropdown?.classList.remove("visible"); // Cierra dropdown si está abierto
  });
  cancelLogoutBtn?.addEventListener("click", () =>
    logoutModal?.classList.remove("visible")
  );
  confirmLogoutBtn?.addEventListener("click", async () => {
    try {
      await logoutUser();
      window.location.href = "/login.html";
    } catch (error) {
      showErrorToast("Error al cerrar sesión.");
    }
  });
  logoutModal?.addEventListener("click", (e) => {
    if (e.target === logoutModal) logoutModal.classList.remove("visible");
  });

  // --- Modal Editar Perfil ---
  editProfileBtn?.addEventListener("click", () => {
    if (fullProfileData) {
      document.getElementById("modal-username").value =
        fullProfileData.username || "";
      document.getElementById("modal-firstName").value =
        fullProfileData.profile.firstName || "";
      document.getElementById("modal-lastName").value =
        fullProfileData.profile.lastName || "";
      document.getElementById("modal-biography").value =
        fullProfileData.profile.biography || "";
      // Formatear fecha para input type="date" (YYYY-MM-DD)
      const birthDate = fullProfileData.profile.birthDate
        ? new Date(fullProfileData.profile.birthDate + "T00:00:00") // Asegura local
            .toISOString()
            .split("T")[0]
        : "";
      document.getElementById("modal-birthDate").value = birthDate;
    }
    profileModal?.classList.add("visible");
    profileOptionsDropdown?.classList.remove("visible");
  });

  cancelProfileBtn?.addEventListener("click", () =>
    profileModal?.classList.remove("visible")
  );
  profileModal?.addEventListener("click", (e) => {
    if (e.target === profileModal) profileModal.classList.remove("visible");
  });

  editProfileForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const profileData = {
      username: document.getElementById("modal-username").value.trim(),
      profile: {
        firstName: document.getElementById("modal-firstName").value.trim(),
        lastName: document.getElementById("modal-lastName").value.trim(),
        biography: document.getElementById("modal-biography").value.trim(),
        birthDate: document.getElementById("modal-birthDate").value || null, // Enviar null si está vacío
      },
    };

    // Validaciones básicas
    if (!profileData.username || profileData.username.length < 3) {
      showErrorToast("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (
      !profileData.profile.firstName ||
      profileData.profile.firstName.length < 2
    ) {
      showErrorToast("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (
      !profileData.profile.lastName ||
      profileData.profile.lastName.length < 2
    ) {
      showErrorToast("El apellido debe tener al menos 2 caracteres.");
      return;
    }

    try {
      const result = await updateProfileData(profileData); // Usa servicio
      showSuccessToast("Perfil guardado correctamente.");
      profileModal?.classList.remove("visible");
      await fetchProfile(); // Recarga los datos del perfil
    } catch (err) {
      showErrorToast(err.message);
    }
  });

  // --- Modal Editar Cuenta ---
  editAccountBtn?.addEventListener("click", () => {
    // ... (lógica llenar modal sin cambios) ...
    if (fullProfileData) {
      document.getElementById("modal-email").value =
        fullProfileData.email || "";
      document.getElementById("modal-currentPassword").value = "";
      document.getElementById("modal-newPassword").value = "";
      document.getElementById("modal-confirmPassword").value = "";
    }
    accountModal?.classList.add("visible");
    accountOptionsDropdown?.classList.remove("visible");
  });

  cancelAccountBtn?.addEventListener("click", () =>
    accountModal?.classList.remove("visible")
  );
  accountModal?.addEventListener("click", (e) => {
    if (e.target === accountModal) accountModal.classList.remove("visible");
  });

  editAccountForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    // ... (lógica validación y preparación datos sin cambios) ...
    const email = document.getElementById("modal-email").value.trim();
    const currentPassword = document.getElementById(
      "modal-currentPassword"
    ).value;
    const newPassword = document.getElementById("modal-newPassword").value;
    const confirmPassword = document.getElementById(
      "modal-confirmPassword"
    ).value;
    let dataToSend = { email };
    // Validar email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      showErrorToast("El formato del correo electrónico no es válido.");
      return;
    }
    // Validar y añadir contraseña si se intenta cambiar
    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) {
        showErrorToast("Ingresa tu contraseña actual para cambiarla.");
        return;
      }
      if (!newPassword) {
        showErrorToast("Ingresa la nueva contraseña.");
        return;
      }
      if (newPassword.length < 8) {
        showErrorToast("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPasswordRegex.test(newPassword)) {
        showErrorToast(
          "La contraseña debe incluir mayúsculas, minúsculas, números y símbolos."
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        showErrorToast("Las nuevas contraseñas no coinciden.");
        return;
      }
      dataToSend.currentPassword = currentPassword;
      dataToSend.newPassword = newPassword;
    }

    try {
      const result = await updateAccountData(dataToSend); // Usa servicio
      showSuccessToast("Cuenta actualizada correctamente.");
      accountModal?.classList.remove("visible");
      await fetchProfile(); // Recarga los datos del perfil
    } catch (err) {
      showErrorToast(err.message);
    }
  });

  // --- Zona de Peligro ---
  deleteAccountBtn?.addEventListener("click", () => {
    deleteConfirmPasswordInput.value = ""; // Limpia contraseña anterior
    deleteAccountModal?.classList.add("visible");
  });

  cancelDeleteAccountBtn?.addEventListener("click", () => {
    deleteAccountModal?.classList.remove("visible");
  });

  confirmDeleteAccountBtn?.addEventListener("click", async () => {
    // ... (lógica confirmación sin cambios) ...
    const password = deleteConfirmPasswordInput.value;
    if (!password) {
      showErrorToast("Ingresa tu contraseña para confirmar la eliminación.");
      return;
    }
    try {
      await deleteAccount(password); // Usa servicio de auth
      showSuccessToast("Cuenta eliminada correctamente. Serás redirigido.");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 2000);
    } catch (error) {
      showErrorToast(`Error al eliminar: ${error.message}`);
    }
  });

  deleteAccountModal?.addEventListener("click", (e) => {
    if (e.target === deleteAccountModal) {
      deleteAccountModal.classList.remove("visible");
    }
  });

  // --- Lógica para Editar Avatar ---
  avatarWrapper?.addEventListener("click", () => {
    avatarInput?.click();
  });

  avatarInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showErrorToast("Por favor, selecciona un archivo de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast("La imagen no debe superar los 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const result = await updateAvatarImage(formData); // Usa servicio
      avatarDisplay.src = result.avatarUrl + `?t=${new Date().getTime()}`; // Actualiza con timestamp
      showSuccessToast("Avatar actualizado correctamente.");
    } catch (error) {
      showErrorToast(`Error al actualizar avatar: ${error.message}`);
    } finally {
      avatarInput.value = ""; // Resetea input
    }
  });

  // --- Inicialización ---
  await fetchProfile(); // Carga inicial del perfil
  switchSection("profile"); // Muestra la sección de perfil por defecto
});
