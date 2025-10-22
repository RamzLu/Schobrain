// ... (otras funciones como registerUser, loginUser, etc. sin cambios) ...
const API_URL = "/auth";
const PROFILE_API_URL = "/api/profile"; // URL base para perfil

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.errors
      ? Object.values(data.errors)
          .map((e) => e.msg)
          .join("\n")
      : data.msg || "Error en el registro.";
    throw new Error(errorMsg);
  }
  return data;
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg || "Credenciales incorrectas.");
  }
  return data;
};

export const logoutUser = async () => {
  try {
    const response = await fetch(`${API_URL}/logout`, {
      // Usa API_URL para logout
      method: "POST",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({})); // Intenta parsear error
      throw new Error(data.msg || "Error al cerrar sesión.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en el logout:", error);
    throw error;
  }
};

export const verifyAuth = async () => {
  try {
    const response = await fetch(`${API_URL}/verify`, {
      // Usa API_URL para verify
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      // Si el token no es válido o expiró, el backend debería devolver 400 o 401
      const errorData = await response
        .json()
        .catch(() => ({ msg: "Token no válido o expirado" }));
      throw new Error(errorData.msg || "Token no válido");
    }
    return await response.json();
  } catch (error) {
    // Ya no redirige, solo lanza el error para que el JS que llama decida qué hacer
    throw error;
  }
};

// FUNCIÓN para eliminar la cuenta (Modificada)
export const deleteAccount = async (password) => {
  // Recibe la contraseña
  try {
    const response = await fetch(`${PROFILE_API_URL}/account`, {
      method: "DELETE",
      headers: {
        // Necesario para enviar JSON en el body
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: password }), // Envía la contraseña
    });

    const data = await response.json().catch(() => ({})); // Intenta parsear JSON siempre

    if (!response.ok) {
      // Lanza el mensaje de error específico del backend (ej. contraseña incorrecta)
      throw new Error(data.message || "Error al eliminar la cuenta.");
    }

    return data; // Devuelve el mensaje de éxito
  } catch (error) {
    console.error("Error en deleteAccount service:", error);
    throw error;
  }
};
