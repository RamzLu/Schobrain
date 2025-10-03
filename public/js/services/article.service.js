// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/services/article.service.js

const API_URL = "/api/articles";

/**
 * Publica una nueva pregunta.
 * @param {FormData} formData - Contiene content, tags, e imageFile.
 * @returns {Promise<Object>} El artículo creado.
 */
export const postQuestion = async (formData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    // CRÍTICO: Eliminar 'Content-Type: application/json'.
    // El navegador lo establece automáticamente como multipart/form-data cuando se usa FormData.
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    // Mapea los errores de validación para mostrarlos
    const errorMsg = data.errors
      ? Object.values(data.errors)
          .map((e) => e.msg)
          .join("\n")
      : data.msg || "Error al publicar la pregunta.";
    throw new Error(errorMsg);
  }
  return data.data;
};

/**
 * Obtiene todos los artículos (preguntas) para el feed.
 * @returns {Promise<Array<Object>>} Lista de artículos.
 */
export const fetchAllArticles = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.msg || "Error al obtener los artículos.");
  }
  return await response.json();
};
