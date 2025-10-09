const API_URL = "/api/profile"; // URL corregida para apuntar a /api/profile
let avatarFile = null;

function setProfileFields(profile, user) {
  document.getElementById("firstName").value = profile.firstName || "";
  document.getElementById("lastName").value = profile.lastName || "";
  document.getElementById("biography").value = profile.biography || "";
  document.getElementById("birthDate").value = profile.birthDate || "";
  document.getElementById("avatarUrl").src =
    profile.avatarUrl ||
    "https://ui-avatars.com/api/?name=" +
      (profile.firstName || "U") +
      "+" +
      (profile.lastName || "N");
  document.getElementById("email").value = user.email || "";
  document.getElementById("username").value = user.username || "";
  document.getElementById("role").innerText = user.role || "";
}

function showMsg(msg, isError = false) {
  const el = document.getElementById("profileMsg");
  el.innerText = msg;
  el.style.color = isError ? "#e63946" : "#059669";
  el.style.fontWeight = isError ? "bold" : "normal";
  setTimeout(() => {
    el.innerText = "";
  }, 2500);
}

async function fetchProfile() {
  try {
    // Se eliminó el encabezado de autorización, la cookie se envía automáticamente
    const res = await fetch(API_URL);
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = "/login.html";
        return;
      }
      throw new Error("No autenticado");
    }
    const user = await res.json();
    setProfileFields(user.profile, user);
  } catch (err) {
    showMsg("Error al cargar perfil", true);
  }
}

async function saveProfile() {
  let avatarUrl = document.getElementById("avatarUrl").src;
  const profile = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    biography: document.getElementById("biography").value,
    birthDate: document.getElementById("birthDate").value,
    avatarUrl: avatarUrl,
  };
  const email = document.getElementById("email").value;
  const username = document.getElementById("username").value;

  // Si hay nueva foto, subirla primero
  if (avatarFile) {
    const formData = new FormData();
    formData.append("avatar", avatarFile);

    const res = await fetch(API_URL + "/avatar", {
      method: "PUT",
      body: formData,
    });
    const result = await res.json();
    if (res.ok && result.avatarUrl) {
      avatarUrl = result.avatarUrl;
      profile.avatarUrl = avatarUrl;
      document.getElementById("avatarUrl").src = avatarUrl;
    } else {
      showMsg(result.message || "Error al subir la foto", true);
      return;
    }
  }

  try {
    const res = await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile, email, username }),
    });
    const result = await res.json();
    if (!res.ok) {
      showMsg(result.message || "Error al guardar perfil", true);
      return;
    }
    showMsg("Perfil guardado correctamente", false);
    avatarFile = null;
    fetchProfile(); // Recarga los datos actualizados
  } catch (err) {
    showMsg("Error al guardar perfil", true);
  }
}

// Cambiar foto de perfil
document.getElementById("avatarInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    avatarFile = file;
    const reader = new FileReader();
    reader.onload = function (ev) {
      document.getElementById("avatarUrl").src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }
});

document
  .getElementById("saveProfileBtn")
  .addEventListener("click", saveProfile);
window.addEventListener("DOMContentLoaded", fetchProfile);
