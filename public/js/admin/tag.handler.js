// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/admin/tag.handler.js

import { createTagApi, fetchAllTags } from "../services/tag.service.js"; // ⬅️ IMPORTADO fetchAllTags
import { loadExistingTags } from "./tag.ui.js"; // ⬅️ IMPORTADO loadExistingTags

const form = document.getElementById("createTagForm");
const errorMessageElement = document.getElementById("tag-error-message");
const successMessageElement = document.getElementById("tag-success-message");

/**
 * Muestra el mensaje de error y oculta el de éxito.
 * @param {string} msg
 */
const displayError = (msg) => {
  errorMessageElement.textContent = msg;
  errorMessageElement.classList.add("visible");
  successMessageElement.classList.remove("visible");
};

/**
 * Muestra el mensaje de éxito y oculta el de error.
 * @param {string} msg
 */
const displaySuccess = (msg) => {
  successMessageElement.textContent = msg;
  successMessageElement.classList.add("visible");
  errorMessageElement.classList.remove("visible");
};

/**
 * Limpia los mensajes de estado.
 */
const clearMessages = () => {
  errorMessageElement.classList.remove("visible");
  errorMessageElement.textContent = "";
  successMessageElement.classList.remove("visible");
  successMessageElement.textContent = "";
};

/**
 * Inicializa la sección de etiquetas: obtiene y renderiza las existentes.
 */
export const initializeTagSection = async () => {
  try {
    const tags = await fetchAllTags();
    loadExistingTags(tags);
  } catch (error) {
    console.error("Error al cargar las etiquetas existentes:", error);
    // Mostrar un mensaje de error en la lista si falla
    const listContainer = document.getElementById("existing-tags-list");
    if (listContainer) {
      listContainer.innerHTML = `<p class="error-text visible" style="color: #ff5c5c; text-align: center;">Error al cargar las etiquetas: ${error.message}</p>`;
    }
  }
};

export const handleCreateTag = async (event) => {
  event.preventDefault();
  clearMessages();

  const tagName = form.name.value.trim();
  const tagDescription = form.description.value.trim();

  // Validación básica del frontend (backend tiene validaciones completas)
  if (!tagName) {
    displayError("El nombre de la etiqueta es obligatorio.");
    return;
  }

  const tagData = {
    name: tagName,
    description: tagDescription,
  };

  try {
    const result = await createTagApi(tagData);
    displaySuccess(`✅ ${result.msg}: ${tagName}`);

    // Limpiar el formulario después del éxito
    form.name.value = "";
    form.description.value = "";

    // Actualizar la lista de tags
    await initializeTagSection(); // ⬅️ Recargar la lista tras crear uno nuevo
  } catch (error) {
    console.error("Error al crear la etiqueta:", error);
    displayError(`Error: ${error.message}`);
  }
};
