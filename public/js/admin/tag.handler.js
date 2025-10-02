// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/admin/tag.handler.js

import {
  createTagApi,
  fetchAllTags,
  deleteTagApi,
} from "../services/tag.service.js";
import { loadExistingTags } from "./tag.ui.js";

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
  clearMessages(); // Limpiar mensajes al recargar
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

/**
 * Maneja la lógica de eliminación de una etiqueta.
 * Utiliza delegación de eventos.
 * @param {Event} event
 */
export const handleDeleteTag = async (event) => {
  // Usar event delegation para capturar clics en el botón de eliminar
  const deleteButton = event.target.closest(".delete-tag-btn");
  if (!deleteButton) return;

  event.preventDefault();
  clearMessages();

  const tagId = deleteButton.dataset.tagId;

  if (!tagId) {
    displayError("ID de etiqueta no encontrado.");
    return;
  }

  const confirmDeletion = window.confirm(
    "¿Estás seguro de que deseas eliminar esta etiqueta? Esta acción es irreversible y la eliminará de todos los artículos que la contengan."
  );

  if (confirmDeletion) {
    try {
      const result = await deleteTagApi(tagId);
      displaySuccess(`✅ ${result.msg}`);

      // Recargar la lista de tags después de la eliminación
      await initializeTagSection();
    } catch (error) {
      console.error("Error al eliminar la etiqueta:", error);
      displayError(`Error al eliminar: ${error.message}`);
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
    await initializeTagSection(); // Recargar la lista tras crear uno nuevo
  } catch (error) {
    console.error("Error al crear la etiqueta:", error);
    displayError(`Error: ${error.message}`);
  }
};
