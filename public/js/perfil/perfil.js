import { verifyAuth, logoutUser } from "../services/auth.service.js";
import { showSuccessToast, showErrorToast } from "../utils/notifications.js";

const API_URL = "/api/profile";

document.addEventListener("DOMContentLoaded", async () => {
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

  const optionsMenu = document.querySelector(".profile-options-menu");
  const optionsToggleBtn = optionsMenu.querySelector(".options-toggle-btn");
  const optionsDropdown = optionsMenu.querySelector(".options-dropdown");

  const editProfileBtn = document.getElementById("edit-profile-btn");
  const modal = document.getElementById("edit-profile-modal");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const editProfileForm = document.getElementById("edit-profile-form");

  const logoutBtn = document.getElementById("logout-btn-perfil");
  const logoutModal = document.getElementById("logout-modal");
  const cancelLogoutBtn = document.getElementById("cancel-logout");
  const confirmLogoutBtn = document.getElementById("confirm-logout");

  optionsToggleBtn.addEventListener("click", () => {
    optionsDropdown.classList.toggle("visible");
  });

  document.addEventListener("click", (event) => {
    if (!optionsMenu.contains(event.target)) {
      optionsDropdown.classList.remove("visible");
    }
  });

  logoutBtn.addEventListener("click", () => {
    logoutModal.classList.add("visible");
    optionsDropdown.classList.remove("visible");
  });

  cancelLogoutBtn.addEventListener("click", () => {
    logoutModal.classList.remove("visible");
  });

  confirmLogoutBtn.addEventListener("click", async () => {
    try {
      await logoutUser();
      window.location.href = "/login.html";
    } catch (error) {
      showErrorToast("Error al cerrar sesión.");
    }
  });

  const setProfileFields = (data) => {
    const { profile, email, username, role } = data;
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
    document.getElementById("email").textContent = email || "";
    document.getElementById("biography-display").textContent =
      profile.biography || "No has añadido una biografía.";
    document.getElementById("birthdate-display").textContent = profile.birthDate
      ? new Date(profile.birthDate).toLocaleDateString()
      : "No especificada.";
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("No se pudo cargar el perfil.");
      const data = await res.json();
      setProfileFields(data);
      return data;
    } catch (err) {
      showErrorToast(err.message);
    }
  };

  let fullProfileData = await fetchProfile();

  editProfileBtn.addEventListener("click", () => {
    if (fullProfileData) {
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
    modal.classList.add("visible");
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("visible");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("visible");
    }
  });

  editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const profileData = {
      profile: {
        firstName: document.getElementById("modal-firstName").value,
        lastName: document.getElementById("modal-lastName").value,
        biography: document.getElementById("modal-biography").value,
        birthDate: document.getElementById("modal-birthDate").value,
      },
    };

    try {
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Error al guardar el perfil.");

      showSuccessToast("Perfil guardado correctamente.");
      modal.classList.remove("visible");
      fullProfileData = await fetchProfile();
    } catch (err) {
      showErrorToast(err.message);
    }
  });
});
