// No es necesario el localhost:3005 porque frontend y backend están en el mismo origen
const API_URL = "/auth";

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) {
    // Mapea los errores de validación para mostrarlos
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
    const response = await fetch("/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Error al cerrar sesión.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en el logout:", error);
    throw error;
  }
};

export const verifyAuth = async () => {
  try {
    const response = await fetch("/auth/verify", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    // Si la respuesta no es OK (ej. 400, 401), lanzará un error
    if (!response.ok) {
      throw new Error("Token no válido");
    }
    return await response.json();
  } catch (error) {
    // ⬇️ CORRECCIÓN: Se elimina la redirección interna. Solo se lanza el error.
    throw error;
  }
};
