// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/services/tag.service.js

const API_URL = "/api/tags";

/**
 * Crea una nueva etiqueta (Tag) en el backend.
 * @param {Object} tagData - Contiene name y description.
 * @returns {Promise<Object>} El tag creado.
 */
export const createTagApi = async (tagData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tagData),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.errors
      ? Object.values(data.errors)
          .map((e) => e.msg)
          .join("\n")
      : data.msg || "Error al crear la etiqueta.";
    throw new Error(errorMsg);
  }
  return data;
};

/**
 * Obtiene todas las etiquetas (Tags) del backend.
 * @returns {Promise<Array<Object>>} Lista de tags.
 */
export const fetchAllTags = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.msg || "Error al obtener las etiquetas.");
  }
  return await response.json();
};
/**
 * Elimina una etiqueta (Tag) del backend. ⬅️ NUEVA FUNCIÓN
 * @param {string} tagId - El ID de la etiqueta a eliminar.
 * @returns {Promise<Object>} La respuesta de confirmación.
 */
export const deleteTagApi = async (tagId) => {
  const response = await fetch(`${API_URL}/${tagId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || "Error al eliminar la etiqueta.");
  }
  return data;
};
