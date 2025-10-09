import { verifyAuth } from "../services/auth.service.js";
import { showSuccessToast, showErrorToast } from "../utils/notifications.js";

const API_URL = "/api/profile";
let avatarFile = null;

/**
 * Rellena los campos del perfil con los datos del usuario.
 */
function setProfileFields(data) {
  const { profile, email, username, role } = data;
  document.getElementById("firstName").textContent =
    profile.firstName || "Nombre";
  document.getElementById("lastName").textContent =
    profile.lastName || "Apellido";
  document.getElementById("username").textContent = `@${
    username || "username"
  }`;
  document.getElementById("biography").value = profile.biography || "";
  document.getElementById("birthDate").value = profile.birthDate
    ? profile.birthDate.split("T")[0]
    : "";
  document.getElementById("avatarUrl").src =
    profile.avatarUrl ||
    `https://ui-avatars.com/api/?name=${
      profile.firstName || "S"
    }&background=random`;
  document.getElementById("role").textContent = role || "Usuario";
}

/**
 * Carga los datos del perfil del usuario desde la API.
 */
async function fetchProfile() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("No se pudo cargar el perfil.");
    const data = await res.json();
    setProfileFields(data);
  } catch (err) {
    showErrorToast(err.message);
  }
}

/**
 * Guarda los cambios realizados en el perfil.
 */
async function saveProfile() {
  let finalAvatarUrl = document.getElementById("avatarUrl").src;

  // Si hay un nuevo archivo de avatar, súbelo primero.
  if (avatarFile) {
    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      const res = await fetch(API_URL + "/avatar", {
        method: "PUT",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Error al subir la foto.");
      finalAvatarUrl = result.avatarUrl;
    } catch (error) {
      showErrorToast(error.message);
      return;
    }
  }

  // Prepara los datos del perfil para enviar.
  const profileData = {
    profile: {
      firstName: document.getElementById("firstName").textContent,
      lastName: document.getElementById("lastName").textContent,
      biography: document.getElementById("biography").value,
      birthDate: document.getElementById("birthDate").value,
      avatarUrl: finalAvatarUrl,
    },
  };

  // Envía los datos actualizados al backend.
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
    avatarFile = null; // Resetea el archivo de avatar
    fetchProfile(); // Recarga los datos para asegurar consistencia
  } catch (err) {
    showErrorToast(err.message);
  }
}

// --- Lógica principal y listeners ---
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

  await fetchProfile(); // Carga los datos del perfil al cargar la página

  // Listener para guardar los cambios
  document
    .getElementById("saveProfileBtn")
    .addEventListener("click", saveProfile);

  // Listener para previsualizar el nuevo avatar
  document.getElementById("avatarInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      avatarFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById("avatarUrl").src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Hacer los campos de nombre y apellido editables
  const firstNameSpan = document.getElementById("firstName");
  const lastNameSpan = document.getElementById("lastName");

  firstNameSpan.contentEditable = true;
  lastNameSpan.contentEditable = true;
});
