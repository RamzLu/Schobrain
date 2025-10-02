// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/article/article.handler.js

import { postQuestion, fetchAllArticles } from "../services/article.service.js";
import { fetchAllTags } from "../services/tag.service.js"; // ⬅️ NUEVO: Importamos fetchAllTags
import {
  hideAskQuestionModal,
  loadArticles,
  populateTagSelector,
} from "./article.ui.js"; // ⬅️ NUEVO: Importamos populateTagSelector

// Llama a la API para obtener y mostrar todos los artículos al cargar la página
export const initializeArticleFeed = async () => {
  try {
    // 1. Cargar el feed de artículos
    const articles = await fetchAllArticles();
    loadArticles(articles);

    // 2. Cargar las etiquetas para el modal (NUEVO)
    const tags = await fetchAllTags();
    populateTagSelector(tags);
  } catch (error) {
    console.error("Error al cargar el feed o tags:", error);
    // Mostrar un mensaje de error en el feed si falla
    const questionsList = document.getElementById("questions-list");
    if (questionsList) {
      questionsList.innerHTML = `<p class="error-text visible" style="color: #ff5c5c; text-align: center;">Error al cargar las preguntas: ${error.message}</p>`;
    }
  }
};

// Maneja el envío del formulario para crear un nuevo artículo (pregunta)
export const handlePostQuestion = async (event) => {
  event.preventDefault();
  const form = event.target;
  const content = form["content"].value.trim();
  const tagId = form["tags"].value; // ⬅️ NUEVO: Obtener ID de la etiqueta
  const errorMessageElement = document.getElementById("question-error-message");

  errorMessageElement.classList.remove("visible");
  errorMessageElement.textContent = "";

  if (!content) {
    errorMessageElement.textContent =
      "El contenido de la pregunta no puede estar vacío.";
    errorMessageElement.classList.add("visible");
    return;
  }

  // Validación de longitud mínima (aunque el backend también lo hace)
  if (content.length < 10) {
    errorMessageElement.textContent =
      "El contenido debe tener al menos 10 caracteres.";
    errorMessageElement.classList.add("visible");
    return;
  }

  try {
    // Construir el cuerpo de la petición: tags debe ser un array
    const requestBody = {
      content: content,
      tags: tagId ? [tagId] : [], // Enviar como array con el ID si se seleccionó
    };

    // 1. Publica la pregunta
    await postQuestion(requestBody); // ⬅️ Enviar el cuerpo de la petición

    // 2. Vuelve a cargar el feed para mostrar la nueva pregunta
    await initializeArticleFeed();

    hideAskQuestionModal();
    alert("¡Tu pregunta ha sido publicada!");
  } catch (error) {
    console.error("Error al publicar la pregunta:", error);
    // Mostrar error de validación del backend
    errorMessageElement.textContent = error.message;
    errorMessageElement.classList.add("visible");
  }
};
