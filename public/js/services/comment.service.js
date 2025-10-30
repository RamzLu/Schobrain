// public/js/services/comment.service.js

const API_URL = "/api/comments";

// Endpoint para postear un comentario (Respuesta)
export const postComment = async (commentData) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commentData),
      credentials: "include", // <-- CORRECCIÓN CLAVE: Incluye la cookie con el token
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al publicar la respuesta.");
    }
    return data;
  } catch (error) {
    console.error("Error en postComment service:", error);
    throw error;
  }
};

// Endpoint para eliminar un comentario
export const deleteComment = async (commentId) => {
  try {
    const response = await fetch(`${API_URL}/${commentId}`, {
      method: "DELETE",
      credentials: "include", // <-- CORRECCIÓN CLAVE: Incluye la cookie con el token
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al eliminar la respuesta.");
    }
    return data;
  } catch (error) {
    console.error("Error en deleteComment service:", error);
    throw error;
  }
};

// Endpoint para votar un comentario
export const voteOnComment = async (commentId, voteType) => {
  try {
    const response = await fetch(`${API_URL}/${commentId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ voteType }),
      credentials: "include", // <-- CORRECCIÓN CLAVE: Incluye la cookie con el token
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al votar la respuesta.");
    }
    return data;
  } catch (error) {
    console.error("Error en voteOnComment service:", error);
    throw error;
  }
};

// NUEVA FUNCIÓN: Obtener comentarios del usuario logueado (Respuestas)
export const getMyComments = async () => {
  try {
    const response = await fetch(`${API_URL}/my`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        data.msg || data.message || "Error al obtener tus respuestas."
      );
    }
    // El backend devuelve { msg: "...", data: comment[] }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error en getMyComments service:", error);
    throw error;
  }
};
