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

export const searchArticles = async (query) => {
  const response = await fetch(
    `${API_URL}/search?query=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.msg || "Error al realizar la búsqueda.");
  }
  return await response.json();
};

export const fetchArticlesByTag = async (tagName) => {
  // --- CORRECCIÓN CLAVE ---
  // Se codifica el nombre de la etiqueta para que los caracteres especiales
  // como '/' y espacios sean seguros para la URL.
  const encodedTagName = encodeURIComponent(tagName);
  const response = await fetch(`${API_URL}/tag/${encodedTagName}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    // Si la respuesta no es JSON, lanzamos un error más genérico.
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error(`Error en el servidor: ${response.statusText}`);
    }
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

export const updateArticle = async (articleId, formData) => {
  const response = await fetch(`${API_URL}/${articleId}`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al actualizar la pregunta.");
  }

  return await response.json();
};
