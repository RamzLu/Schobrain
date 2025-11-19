// public/js/services/profile.service.js

const API_URL = "/api/profile";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    // No Content-Type for FormData (browser sets it)
  };
};

export const getProfile = async () => {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Error al obtener perfil");
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateProfileData = async (profileData) => {
  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Error al actualizar perfil");
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateAccountData = async (accountData) => {
  try {
    const response = await fetch(`${API_URL}/account`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(accountData),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Error al actualizar cuenta");
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateAvatarImage = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/avatar`, {
      method: "PUT",
      headers: getHeaders(),
      body: formData,
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Error al actualizar avatar");
    return data;
  } catch (error) {
    throw error;
  }
};

// === NUEVA FUNCIÓN: SUBIR BANNER ===
export const updateBannerImage = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/banner`, {
      method: "PUT",
      headers: getHeaders(),
      body: formData,
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Error al actualizar banner");
    return data;
  } catch (error) {
    throw error;
  }
};

export const getFavoriteArticles = async () => {
  try {
    const response = await fetch(`${API_URL}/favorites/articles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Error al obtener favoritos");
    return data;
  } catch (error) {
    throw error;
  }
};

export const getFavoriteComments = async () => {
  try {
    const response = await fetch(`${API_URL}/favorites/comments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Error al obtener comentarios favoritos");
    return data;
  } catch (error) {
    throw error;
  }
};

export const toggleFavoriteComment = async (commentId) => {
  try {
    const response = await fetch(`${API_URL}/favorites/comment/${commentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Error al actualizar favoritos");
    return data;
  } catch (error) {
    throw error;
  }
};
