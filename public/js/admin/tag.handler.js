// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/admin/tag.handler.js

import { createTagApi } from "../services/tag.service.js";

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
  } catch (error) {
    console.error("Error al crear la etiqueta:", error);
    displayError(`Error: ${error.message}`);
  }
};
