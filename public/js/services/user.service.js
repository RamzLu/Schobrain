// public/js/services/user.service.js

const API_URL = "/api/users";

/**
 * Obtiene los datos del perfil público de un usuario por su ID.
 * @param {string} userId - El ID del usuario a consultar.
 * @returns {Promise<Object>} Los datos públicos del usuario.
 */
export const fetchPublicUserProfile = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/${userId}/public`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || "Error al cargar el perfil del usuario.");
    }
    return data;
  } catch (error) {
    console.error("Error en fetchPublicUserProfile service:", error);
    throw error;
  }
};

export const fetchTopContributors = async () => {
  try {
    const response = await fetch(`${API_URL}/top-contributors`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || "Error al cargar los contribuyentes.");
    }
    return data; // Devuelve el array de usuarios
  } catch (error) {
    console.error("Error en fetchTopContributors service:", error);
    throw error;
  }
};
