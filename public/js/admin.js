// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/admin.js

import { verifyAuth } from "./services/auth.service.js";
import { handleCreateTag, initializeTagSection } from "./admin/tag.handler.js"; // ⬅️ Importado initializeTagSection

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

    // 3. Inicializa la sección de tags: carga y maneja la creación
    await initializeTagSection(); // ⬅️ Llamar a la función para cargar la lista de tags

    // 4. Inicializa los handlers del formulario de Tags
    const createTagForm = document.getElementById("createTagForm");
    if (createTagForm) {
      createTagForm.addEventListener("submit", handleCreateTag);
    }
  } catch (error) {
    // verifyAuth ya redirige si falla el token, pero si falla por permisos
    console.error("Error de autenticación o permiso:", error);
    return;
  }
};

document.addEventListener("DOMContentLoaded", initializeAdminPage);
