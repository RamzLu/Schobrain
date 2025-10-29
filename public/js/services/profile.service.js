// public/js/services/profile.service.js
import { logoutUser as authLogout } from "./auth.service.js"; // Importa si necesitas logout

const API_URL = "/api/profile";
const ACCOUNT_API_URL = "/api/profile/account";
const AVATAR_API_URL = "/api/profile/avatar";
// Definición de las constantes de URL para favoritos (PREGUNTAS y RESPUESTAS)
const FAVORITES_ARTICLES_API_URL = "/api/profile/favorites/articles";
const FAVORITES_COMMENTS_API_URL = "/api/profile/favorites/comments";

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
    return result;
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
    return result;
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

// OBTENER artículos favoritos (Preguntas)
export const getFavoriteArticles = async () => {
  try {
    const response = await fetch(FAVORITES_ARTICLES_API_URL); // Usa la constante definida
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.msg || "Error al cargar favoritos."
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error en getFavoriteArticles service:", error);
    throw error;
  }
};

// NUEVA FUNCIÓN: Obtener comentarios favoritos (Respuestas)
export const getFavoriteComments = async () => {
  try {
    const response = await fetch(FAVORITES_COMMENTS_API_URL); // Usa la constante definida
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          errorData.msg ||
          "Error al cargar respuestas favoritas."
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error en getFavoriteComments service:", error);
    throw error;
  }
};

// NUEVA FUNCIÓN: Añadir/quitar comentario de favoritos (Respuestas)
export const toggleFavoriteComment = async (commentId) => {
  // Nota: La ruta para el toggle usa el ID en la URL y la base API_URL
  const response = await fetch(`${API_URL}/favorites/comment/${commentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.message || data.msg || "Error al actualizar la respuesta favorita."
    );
  }
  return data;
};
