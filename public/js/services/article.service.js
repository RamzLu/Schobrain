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
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
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

/**
 * Obtiene artículos filtrados por una etiqueta específica.
 * @param {string} tagName
 * @returns {Promise<Array<Object>>}
 */
export const fetchArticlesByTag = async (tagName) => {
  const response = await fetch(`${API_URL}/tag/${tagName}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.msg || `Error al obtener artículos de ${tagName}.`);
  }
  return await response.json();
};

/**
 * Elimina un artículo por su ID.
 * @param {string} articleId - El ID del artículo a eliminar.
 * @returns {Promise<Object>} La respuesta del servidor.
 */
export const deleteArticle = async (articleId) => {
  const response = await fetch(`${API_URL}/${articleId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(
      data.msg ||
        "No tienes permiso para eliminar esta pregunta o ha ocurrido un error."
    );
  }

  return await response.json();
};
