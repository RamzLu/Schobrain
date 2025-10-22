// public/js/services/profile.service.js
import { logoutUser as authLogout } from "./auth.service.js"; // Importa si necesitas logout

const API_URL = "/api/profile";
const ACCOUNT_API_URL = "/api/profile/account";
const AVATAR_API_URL = "/api/profile/avatar";
const FAVORITES_API_URL = "/api/profile/favorites"; // Nueva URL base para favoritos

// Obtener datos del perfil del usuario logueado
export const getProfile = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.msg || "Error al cargar el perfil."
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error en getProfile service:", error);
    throw error;
  }
};

// Actualizar datos básicos del perfil (username, nombre, apellido, bio, fecha nac)
export const updateProfileData = async (profileData) => {
  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(
        result.message || result.msg || "Error al guardar el perfil."
      );
    }
    return result; // Devuelve la respuesta completa { profile, email, username, role, favorites }
  } catch (error) {
    console.error("Error en updateProfileData service:", error);
    throw error;
  }
};

// Actualizar datos de la cuenta (email, contraseña)
export const updateAccountData = async (accountData) => {
  try {
    const response = await fetch(ACCOUNT_API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(
        result.message || result.msg || "Error al actualizar la cuenta."
      );
    }
    return result; // Devuelve { message: "..." }
  } catch (error) {
    console.error("Error en updateAccountData service:", error);
    throw error;
  }
};

// Actualizar imagen de avatar
export const updateAvatarImage = async (formData) => {
  try {
    const response = await fetch(AVATAR_API_URL, {
      method: "PUT",
      body: formData, // FormData maneja Content-Type
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.msg || "Error al subir imagen.");
    }
    return result; // Devuelve { avatarUrl: "..." }
  } catch (error) {
    console.error("Error en updateAvatarImage service:", error);
    throw error;
  }
};

// NUEVA FUNCIÓN: Obtener artículos favoritos
export const getFavoriteArticles = async () => {
  try {
    const response = await fetch(FAVORITES_API_URL); // GET a /api/profile/favorites
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.msg || "Error al cargar favoritos."
      );
    }
    return await response.json(); // Devuelve el array de artículos populados
  } catch (error) {
    console.error("Error en getFavoriteArticles service:", error);
    throw error;
  }
};

// Puedes mantener o mover la función de logout aquí si prefieres
// export const logoutUser = authLogout;
