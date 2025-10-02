import { verifyAuth } from "./services/auth.service.js";
import {
  handleCreateTag,
  initializeTagSection,
  handleDeleteTag,
} from "./admin/tag.handler.js"; // ⬅️ Importado handleDeleteTag

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
    await initializeTagSection(); // Cargar la lista de tags

    // 4. Inicializa los handlers del formulario de Tags
    const createTagForm = document.getElementById("createTagForm");
    if (createTagForm) {
      createTagForm.addEventListener("submit", handleCreateTag);
    }

    // 5. Configurar el listener de delegación para la eliminación de tags (NUEVO)
    const tagsListContainer = document.getElementById("existing-tags-list");
    if (tagsListContainer) {
      // Usamos el contenedor principal y el handler decidirá si el clic fue en el botón de eliminar.
      tagsListContainer.addEventListener("click", handleDeleteTag);
    }
  } catch (error) {
    // verifyAuth ya redirige si falla el token, pero si falla por permisos
    console.error("Error de autenticación o permiso:", error);
    return;
  }
};

document.addEventListener("DOMContentLoaded", initializeAdminPage);
