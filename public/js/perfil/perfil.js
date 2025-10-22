import {
  verifyAuth,
  logoutUser,
  deleteAccount,
} from "../services/auth.service.js"; // Importa deleteAccount
import { showSuccessToast, showErrorToast } from "../utils/notifications.js";

const API_URL = "/api/profile";
const ACCOUNT_API_URL = "/api/profile/account";

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
    document.getElementById("avatarUrl").src =
      profile.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        profile.firstName || ""
      )}+${encodeURIComponent(profile.lastName || "")}&background=random`;
    document.getElementById("role").textContent = role || "Usuario";
    document.getElementById("biography-display").textContent =
      profile.biography || "No has añadido una biografía.";
    document.getElementById("birthdate-display").textContent = profile.birthDate
      ? new Date(profile.birthDate).toLocaleDateString("es-ES") // Formato localizado
      : "No especificada.";

    // Cuenta
    document.getElementById("email-display").textContent = email || "";
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("No se pudo cargar el perfil.");
      const data = await res.json();
      fullProfileData = data; // Guarda los datos completos
      setProfileFields(data);
    } catch (err) {
      showErrorToast(`Error al cargar datos: ${err.message}`);
    }
  };

  // Función para cambiar la sección visible
  const switchSection = (sectionId) => {
    // Ocultar todas las secciones
    document.querySelectorAll(".profile-content").forEach((section) => {
      section.classList.remove("active-section");
    });
    // Mostrar la sección deseada
    const sectionToShow = document.getElementById(`${sectionId}-section`);
    if (sectionToShow) {
      sectionToShow.classList.add("active-section");
    }
    // Actualizar clase 'active' en la navegación
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.section === sectionId);
    });
  };

  // --- Event Listeners (Navegación, Menús Opciones, Logout, Editar Perfil, Editar Cuenta sin cambios) ---
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
      e.stopPropagation(); // Evita que se cierre inmediatamente
      profileOptionsDropdown?.classList.toggle("visible");
      accountOptionsDropdown?.classList.remove("visible"); // Cierra el otro menú
    });
  }

  // Menú Opciones Cuenta
  if (accountOptionsToggleBtn) {
    accountOptionsToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Evita que se cierre inmediatamente
      accountOptionsDropdown?.classList.toggle("visible");
      profileOptionsDropdown?.classList.remove("visible"); // Cierra el otro menú
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
    const profileData = {
      username: document.getElementById("modal-username").value.trim(),
      profile: {
        firstName: document.getElementById("modal-firstName").value.trim(),
        lastName: document.getElementById("modal-lastName").value.trim(),
        biography: document.getElementById("modal-biography").value.trim(),
        birthDate: document.getElementById("modal-birthDate").value,
      },
    };

    // Validación simple de frontend
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
        // Si el backend devuelve un mensaje específico (ej. "usuario ya en uso"), lo mostramos
        throw new Error(result.message || "Error al guardar el perfil.");
      }

      showSuccessToast("Perfil guardado correctamente.");
      profileModal.classList.remove("visible");
      await fetchProfile(); // Recarga los datos
    } catch (err) {
      showErrorToast(err.message);
    }
  });

  // --- Modal Editar Cuenta ---
  editAccountBtn?.addEventListener("click", () => {
    if (fullProfileData) {
      document.getElementById("modal-email").value =
        fullProfileData.email || "";
      // Limpia los campos de contraseña cada vez que se abre
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

    const email = document.getElementById("modal-email").value.trim();
    const currentPassword = document.getElementById(
      "modal-currentPassword"
    ).value;
    const newPassword = document.getElementById("modal-newPassword").value;
    const confirmPassword = document.getElementById(
      "modal-confirmPassword"
    ).value;

    let dataToSend = { email };

    // --- Validaciones de Contraseña ---
    if (newPassword || currentPassword || confirmPassword) {
      // Si intenta cambiar contraseña
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
      // Expresión regular para contraseña fuerte (igual que en el backend)
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
      // Si todo está bien, añadimos las contraseñas a los datos
      dataToSend.currentPassword = currentPassword;
      dataToSend.newPassword = newPassword;
    }
    // --- Fin Validaciones Contraseña ---

    // Validación simple de Email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      showErrorToast("El formato del correo electrónico no es válido.");
      return;
    }

    try {
      const res = await fetch(ACCOUNT_API_URL, {
        // Llama a la nueva ruta
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
      await fetchProfile(); // Recarga los datos (el email podría haber cambiado)
    } catch (err) {
      showErrorToast(err.message);
    }
  });

  // --- Zona de Peligro --- (NUEVO)
  deleteAccountBtn?.addEventListener("click", () => {
    deleteAccountModal.classList.add("visible");
  });

  cancelDeleteAccountBtn?.addEventListener("click", () => {
    deleteAccountModal.classList.remove("visible");
  });

  confirmDeleteAccountBtn?.addEventListener("click", async () => {
    try {
      // ! ¡¡¡ IMPORTANTE !!! ****
      // Aquí iría la llamada REAL al backend para eliminar la cuenta.
      await deleteAccount(); // Llama a la función del servicio
      // ! ¡¡¡ IMPORTANTE !!! ****

      showSuccessToast("Cuenta eliminada correctamente. Serás redirigido.");
      // Espera un poco para que el usuario vea el mensaje
      setTimeout(() => {
        window.location.href = "/login.html"; // Redirige al login después de eliminar
      }, 2000);
    } catch (error) {
      showErrorToast(`Error al eliminar la cuenta: ${error.message}`);
      deleteAccountModal.classList.remove("visible"); // Cierra el modal en caso de error
    }
  });

  deleteAccountModal?.addEventListener("click", (e) => {
    if (e.target === deleteAccountModal) {
      deleteAccountModal.classList.remove("visible");
    }
  });
  // --- Fin Zona de Peligro ---

  // --- Inicialización ---
  await fetchProfile(); // Carga inicial de datos
  switchSection("profile"); // Muestra la sección de perfil por defecto
}); // Fin DOMContentLoaded
