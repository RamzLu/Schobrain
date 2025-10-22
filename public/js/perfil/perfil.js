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
  getFavoriteArticles, // Importa la nueva función
} from "../services/profile.service.js"; // Asume que creaste este archivo
import { showSuccessToast, showErrorToast } from "../utils/notifications.js";
import { renderArticleCard } from "../article/article.ui.js"; // Importa para reutilizar
import { initializeLightbox } from "../utils/lightbox.js"; // Importa lightbox

document.addEventListener("DOMContentLoaded", async () => {
  let currentUser;
  let fullProfileData = null; // Para almacenar todos los datos del perfil, incluidos favoritos

  try {
    const authData = await verifyAuth();
    currentUser = authData.data;
    document.getElementById("logged-in-username").textContent =
      currentUser.firstName;
  } catch (error) {
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
  const favoritesSection = document.getElementById("favorites-section");
  const favoritesListContainer = document.getElementById("favorites-list");

  // --- Funciones ---
  const setProfileFields = (data) => {
    // ... (sin cambios) ...
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
      // Podrías precargar favoritos aquí si quieres, o hacerlo al cambiar de sección
    } catch (err) {
      showErrorToast(`Error al cargar datos: ${err.message}`);
    }
  };

  // NUEVA FUNCIÓN para cargar y mostrar favoritos
  const loadFavorites = async () => {
    if (!favoritesListContainer) return;
    favoritesListContainer.innerHTML = "<p>Cargando favoritos...</p>"; // Mensaje de carga

    try {
      const favoriteArticles = await getFavoriteArticles(); // Llama al servicio

      if (favoriteArticles.length === 0) {
        favoritesListContainer.innerHTML =
          "<p>Aún no has añadido ninguna pregunta a favoritos.</p>";
        return;
      }

      // Reutiliza renderArticleCard para mostrar cada favorito
      favoritesListContainer.innerHTML = favoriteArticles
        .map((article) =>
          renderArticleCard(
            article,
            currentUser,
            fullProfileData?.favorites || [] // Pasa la lista de IDs favoritos
          )
        )
        .join("");

      // Inicializa lightbox para las imágenes en la lista de favoritos
      initializeLightbox("favorites-list");
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
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

    // Si la sección es 'favorites', carga los artículos
    if (sectionId === "favorites") {
      loadFavorites();
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
