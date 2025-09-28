// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/admin.js

import { verifyAuth } from "./services/auth.service.js";
import { handleCreateTag } from "./admin/tag.handler.js";

const initializeAdminPage = async () => {
  let authData;
  try {
    // 1. Verifica autenticación y permisos
    authData = await verifyAuth();

    // Si no es admin, redirigir al index (o mostrar un mensaje de error)
    if (authData.data.role !== "admin") {
      alert(
        "Acceso denegado: Solo los administradores pueden acceder a esta página."
      );
      window.location.href = "/index.html";
      return;
    }

    // 2. Actualiza el nombre del usuario
    const usernameSpan = document.getElementById("logged-in-username");
    if (usernameSpan && authData && authData.data) {
      usernameSpan.textContent = authData.data.firstName;
    }
  } catch (error) {
    // verifyAuth ya redirige si falla el token, pero si falla por permisos
    console.error("Error de autenticación o permiso:", error);
    return;
  }

  // 3. Inicializa los handlers del formulario de Tags
  const createTagForm = document.getElementById("createTagForm");
  if (createTagForm) {
    createTagForm.addEventListener("submit", handleCreateTag);
  }
};

document.addEventListener("DOMContentLoaded", initializeAdminPage);
