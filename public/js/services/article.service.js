const API_URL = "/api/articles";
const PROFILE_API_URL = "/api/profile"; // URL para favoritos

export const postQuestion = async (formData) => {
  // ... (sin cambios) ...
  const response = await fetch(API_URL, {
    method: "POST",
    body: formData, // No necesitas 'Content-Type', el navegador lo pone con FormData
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.errors
      ? Object.values(data.errors)
          .map((e) => e.msg || e.message) // Puede venir como 'msg' o 'message'
          .join("\n")
      : data.msg || data.message || "Error al publicar la pregunta.";
    throw new Error(errorMsg);
  }
  return data.data; // Asumiendo que el backend devuelve { msg: '...', data: article }
};

export const fetchAllArticles = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" }, // Mantenemos para GET
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({})); // Intenta parsear, sino objeto vacío
    throw new Error(
      data.msg || data.message || "Error al obtener los artículos."
    );
  }
  return await response.json();
};

export const fetchArticleById = async (articleId) => {
  // ... (sin cambios) ...
  const response = await fetch(`${API_URL}/${articleId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.msg || data.message || "Error al obtener la pregunta."
    );
  }
  return await response.json();
};

export const searchArticles = async (query) => {
  // ... (sin cambios) ...
  const response = await fetch(
    `${API_URL}/search?query=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.msg || data.message || "Error al realizar la búsqueda."
    );
  }
  return await response.json();
};

export const fetchArticlesByTag = async (tagName) => {
  // ... (sin cambios) ...
  const encodedTagName = encodeURIComponent(tagName);
  const response = await fetch(`${API_URL}/tag/${encodedTagName}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error(`Error en el servidor: ${response.statusText}`);
    }
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.msg || data.message || `Error al obtener artículos de ${tagName}.`
    );
  }
  return await response.json();
};

export const deleteArticle = async (articleId) => {
  // ... (sin cambios) ...
  const response = await fetch(`${API_URL}/${articleId}`, {
    method: "DELETE",
  });

  // No asumimos JSON en respuesta 200 OK para DELETE si no devuelve cuerpo
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.msg ||
        data.message ||
        "No tienes permiso para eliminar esta pregunta o ha ocurrido un error."
    );
  }

  // Si quieres devolver algo, parsea el JSON, sino puedes devolver un objeto simple
  // return await response.json();
  return { success: true, message: "Artículo eliminado" }; // Ejemplo
};

export const voteOnArticle = async (articleId, voteType) => {
  // ... (sin cambios) ...
  const response = await fetch(`${API_URL}/${articleId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voteType }),
  });

  const data = await response.json(); // Siempre esperamos JSON aquí
  if (!response.ok) {
    throw new Error(data.msg || data.message || "Error al registrar el voto.");
  }
  // Asegúrate que el backend devuelve { msg: '...', data: { likes, dislikes, votedUp, votedDown } }
  return data.data;
};

export const updateArticle = async (articleId, formData) => {
  // ... (sin cambios) ...
  const response = await fetch(`${API_URL}/${articleId}`, {
    method: "PUT",
    body: formData, // FormData gestiona el Content-Type automáticamente
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.msg || "Error al actualizar la pregunta."
    );
  }

  return await response.json(); // Asume que devuelve el artículo actualizado
};

// NUEVA FUNCIÓN para añadir/quitar favorito
export const toggleFavoriteArticle = async (articleId) => {
  const response = await fetch(`${PROFILE_API_URL}/favorites/${articleId}`, {
    method: "POST",
    // No necesita body, el ID va en la URL
    headers: { "Content-Type": "application/json" }, // Aunque no hay body, es buena práctica
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.message || data.msg || "Error al actualizar favoritos."
    );
  }
  // Devuelve el objeto { message, favorites: [...] } del backend
  return data;
};
