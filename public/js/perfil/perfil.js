import {
  verifyAuth,
  logoutUser,
  deleteAccount,
} from "../services/auth.service.js";
import { showSuccessToast, showErrorToast } from "../utils/notifications.js";

const API_URL = "/api/profile";
const ACCOUNT_API_URL = "/api/profile/account";
const AVATAR_API_URL = "/api/profile/avatar"; // URL para el avatar

document.addEventListener("DOMContentLoaded", async () => {
  // ... (Variables y lógica de autenticación sin cambios) ...
  let currentUser;
  try {
    const authData = await verifyAuth();
    currentUser = authData.data;
    document.getElementById("logged-in-username").textContent =
      currentUser.firstName;
  } catch (error) {
    window.location.href = "/login.html";
    return;
  }

  // --- Elementos Comunes, Perfil, Cuenta, Zona Peligro (sin cambios) ---
  // --- Elementos Comunes ---
  const logoutBtnPerfil = document.getElementById("logout-btn-perfil");
  const logoutModal = document.getElementById("logout-modal");
  const cancelLogoutBtn = document.getElementById("cancel-logout");
  const confirmLogoutBtn = document.getElementById("confirm-logout");
  const profileSection = document.getElementById("profile-section");
  const accountSection = document.getElementById("account-section");
  const navLinks = document.querySelectorAll(".profile-nav .nav-link");

  // --- Elementos de Perfil ---
  const profileOptionsMenu = document.querySelector(".profile-options-menu");
  const profileOptionsToggleBtn = profileOptionsMenu?.querySelector(
    ".options-toggle-btn"
  );
  const profileOptionsDropdown =
    profileOptionsMenu?.querySelector(".profile-dropdown");
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const profileModal = document.getElementById("edit-profile-modal");
  const cancelProfileBtn = document.getElementById("cancel-edit-btn");
  const editProfileForm = document.getElementById("edit-profile-form");
  const avatarWrapper = document.getElementById("avatar-wrapper"); // Contenedor del avatar
  const avatarInput = document.getElementById("avatar-input"); // Input file oculto
  const avatarDisplay = document.getElementById("avatarUrl"); // La imagen <img>

  // --- Elementos de Cuenta ---
  const accountOptionsMenu = document.querySelector(".account-options-menu");
  const accountOptionsToggleBtn = accountOptionsMenu?.querySelector(
    ".account-options-toggle"
  );
  const accountOptionsDropdown =
    accountOptionsMenu?.querySelector(".account-dropdown");
  const editAccountBtn = document.getElementById("edit-account-btn");
  const accountModal = document.getElementById("edit-account-modal");
  const cancelAccountBtn = document.getElementById("cancel-edit-account-btn");
  const editAccountForm = document.getElementById("edit-account-form");

  // --- Elementos de Zona de Peligro --- (NUEVO)
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
  ); // Input de contraseña

  let fullProfileData = null;

  // --- Funciones (setProfileFields, fetchProfile, switchSection sin cambios) ---
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
    avatarDisplay.src = // Usa la variable del elemento img
      profile.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        profile.firstName || "NN" // Fallback si no hay nombre
      )}+${encodeURIComponent(profile.lastName || "")}&background=random`;
    document.getElementById("role").textContent = role || "Usuario";
    document.getElementById("biography-display").textContent =
      profile.biography || "No has añadido una biografía.";
    document.getElementById("birthdate-display").textContent = profile.birthDate
      ? new Date(profile.birthDate).toLocaleDateString("es-ES")
      : "No especificada.";

    // Cuenta
    document.getElementById("email-display").textContent = email || "";
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("No se pudo cargar el perfil.");
      const data = await res.json();
      fullProfileData = data;
      setProfileFields(data);
    } catch (err) {
      showErrorToast(`Error al cargar datos: ${err.message}`);
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
  };

  // --- Event Listeners ---

  // ... (Navegación, Menús Opciones, Logout, Editar Perfil, Editar Cuenta, Zona Peligro sin cambios)...
  // Navegación entre secciones
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = e.target.closest("a").dataset.section;
      switchSection(section);
    });
  });

  // Menú Opciones Perfil
  if (profileOptionsToggleBtn) {
    profileOptionsToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileOptionsDropdown?.classList.toggle("visible");
      accountOptionsDropdown?.classList.remove("visible");
    });
  }

  // Menú Opciones Cuenta
  if (accountOptionsToggleBtn) {
    accountOptionsToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      accountOptionsDropdown?.classList.toggle("visible");
      profileOptionsDropdown?.classList.remove("visible");
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

  // Botón Logout (común)
  logoutBtnPerfil?.addEventListener("click", () => {
    logoutModal.classList.add("visible");
    profileOptionsDropdown?.classList.remove("visible");
  });
  cancelLogoutBtn?.addEventListener("click", () =>
    logoutModal.classList.remove("visible")
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
      document.getElementById("modal-birthDate").value = fullProfileData.profile
        .birthDate
        ? fullProfileData.profile.birthDate.split("T")[0]
        : "";
    }
    profileModal.classList.add("visible");
    profileOptionsDropdown?.classList.remove("visible");
  });

  cancelProfileBtn?.addEventListener("click", () =>
    profileModal.classList.remove("visible")
  );
  profileModal?.addEventListener("click", (e) => {
    if (e.target === profileModal) profileModal.classList.remove("visible");
  });

  editProfileForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    // ... (lógica submit perfil sin cambios) ...
    const profileData = {
      username: document.getElementById("modal-username").value.trim(),
      profile: {
        firstName: document.getElementById("modal-firstName").value.trim(),
        lastName: document.getElementById("modal-lastName").value.trim(),
        biography: document.getElementById("modal-biography").value.trim(),
        birthDate: document.getElementById("modal-birthDate").value,
      },
    };
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
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Error al guardar el perfil.");
      }
      showSuccessToast("Perfil guardado correctamente.");
      profileModal.classList.remove("visible");
      await fetchProfile();
    } catch (err) {
      showErrorToast(err.message);
    }
  });

  // --- Modal Editar Cuenta ---
  editAccountBtn?.addEventListener("click", () => {
    // ... (lógica abrir modal cuenta sin cambios) ...
    if (fullProfileData) {
      document.getElementById("modal-email").value =
        fullProfileData.email || "";
      document.getElementById("modal-currentPassword").value = "";
      document.getElementById("modal-newPassword").value = "";
      document.getElementById("modal-confirmPassword").value = "";
    }
    accountModal.classList.add("visible");
    accountOptionsDropdown?.classList.remove("visible");
  });

  cancelAccountBtn?.addEventListener("click", () =>
    accountModal.classList.remove("visible")
  );
  accountModal?.addEventListener("click", (e) => {
    if (e.target === accountModal) accountModal.classList.remove("visible");
  });

  editAccountForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    // ... (lógica submit cuenta sin cambios) ...
    const email = document.getElementById("modal-email").value.trim();
    const currentPassword = document.getElementById(
      "modal-currentPassword"
    ).value;
    const newPassword = document.getElementById("modal-newPassword").value;
    const confirmPassword = document.getElementById(
      "modal-confirmPassword"
    ).value;
    let dataToSend = { email };
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
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      showErrorToast("El formato del correo electrónico no es válido.");
      return;
    }
    try {
      const res = await fetch(ACCOUNT_API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Error al actualizar la cuenta.");
      }
      showSuccessToast("Cuenta actualizada correctamente.");
      accountModal.classList.remove("visible");
      await fetchProfile();
    } catch (err) {
      showErrorToast(err.message);
    }
  });

  // --- Zona de Peligro ---
  deleteAccountBtn?.addEventListener("click", () => {
    // ... (lógica abrir modal eliminación sin cambios) ...
    deleteConfirmPasswordInput.value = "";
    deleteAccountModal.classList.add("visible");
  });

  cancelDeleteAccountBtn?.addEventListener("click", () => {
    // ... (lógica cancelar eliminación sin cambios) ...
    deleteAccountModal.classList.remove("visible");
  });

  confirmDeleteAccountBtn?.addEventListener("click", async () => {
    // ... (lógica confirmar eliminación sin cambios) ...
    const password = deleteConfirmPasswordInput.value;
    if (!password) {
      showErrorToast("Ingresa tu contraseña para confirmar la eliminación.");
      return;
    }
    try {
      await deleteAccount(password);
      showSuccessToast("Cuenta eliminada correctamente. Serás redirigido.");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 2000);
    } catch (error) {
      showErrorToast(`Error al eliminar: ${error.message}`);
    }
  });

  deleteAccountModal?.addEventListener("click", (e) => {
    // ... (lógica cerrar modal eliminación clic fuera sin cambios) ...
    if (e.target === deleteAccountModal) {
      deleteAccountModal.classList.remove("visible");
    }
  });

  // --- Lógica para Editar Avatar (NUEVO) ---
  avatarWrapper?.addEventListener("click", () => {
    avatarInput.click(); // Abre el selector de archivos al hacer clic en el contenedor
  });

  avatarInput?.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return; // No se seleccionó archivo
    }

    // Validación simple de tipo y tamaño (opcional, el backend también valida)
    if (!file.type.startsWith("image/")) {
      showErrorToast("Por favor, selecciona un archivo de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // Límite de 5MB (igual que en backend)
      showErrorToast("La imagen no debe superar los 5MB.");
      return;
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append("avatar", file); // 'avatar' debe coincidir con upload.single('avatar') en la ruta

    try {
      // Mostrar feedback visual (ej. un spinner o texto "Subiendo...") - Opcional
      // avatarDisplay.style.opacity = '0.5';

      const response = await fetch(AVATAR_API_URL, {
        method: "PUT",
        body: formData, // No necesitas 'Content-Type', el navegador lo pone automáticamente para FormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al subir la imagen.");
      }

      // Actualizar la imagen en la UI con la nueva URL devuelta por el backend
      avatarDisplay.src = result.avatarUrl + `?t=${new Date().getTime()}`; // Añade timestamp para evitar caché
      showSuccessToast("Avatar actualizado correctamente.");
    } catch (error) {
      showErrorToast(`Error al actualizar avatar: ${error.message}`);
    } finally {
      // Quitar feedback visual
      // avatarDisplay.style.opacity = '1';
      avatarInput.value = ""; // Resetea el input file para permitir seleccionar el mismo archivo de nuevo
    }
  });
  // --- Fin Lógica Editar Avatar ---

  // --- Inicialización ---
  await fetchProfile();
  switchSection("profile");
}); // Fin DOMContentLoaded
