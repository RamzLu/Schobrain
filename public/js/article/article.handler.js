// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/article/article.handler.js

import { postQuestion, fetchAllArticles } from "../services/article.service.js";
import { hideAskQuestionModal, loadArticles } from "./article.ui.js";

// Llama a la API para obtener y mostrar todos los artículos al cargar la página
export const initializeArticleFeed = async () => {
  try {
    const articles = await fetchAllArticles();
    loadArticles(articles); // Cargar todos los artículos
  } catch (error) {
    console.error("Error al cargar el feed de artículos:", error);
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
    // 1. Publica la pregunta
    await postQuestion(content);

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
