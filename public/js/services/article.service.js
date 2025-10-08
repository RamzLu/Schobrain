// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/services/article.service.js

const API_URL = "/api/articles";

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

export const fetchArticleById = async (articleId) => {
  const response = await fetch(`${API_URL}/${articleId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.msg || "Error al obtener la pregunta.");
  }
  return await response.json();
};

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

/**
 * Envía un voto (like/dislike) para un artículo.
 * @param {string} articleId - El ID del artículo.
 * @param {'like' | 'dislike'} voteType - El tipo de voto.
 * @returns {Promise<Object>} Los contadores de votos actualizados.
 */
export const voteOnArticle = async (articleId, voteType) => {
  const response = await fetch(`${API_URL}/${articleId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voteType }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || "Error al registrar el voto.");
  }
  return data.data;
};
