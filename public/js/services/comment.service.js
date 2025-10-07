const API_URL = "/api/comments";

/**
 * Publica un nuevo comentario para un artículo.
 * @param {Object} commentData - { content, author, article }
 * @returns {Promise<Object>} El comentario creado.
 */
export const postComment = async (commentData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(commentData),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.errors
      ? Object.values(data.errors)
          .map((e) => e.msg)
          .join("\n")
      : data.msg || "Error al publicar la respuesta.";
    throw new Error(errorMsg);
  }
  return data.data;
};
