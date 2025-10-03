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
  const tagId = form["tags"].value;
  const imageFile = form["imageFile"].files[0]; // ⬅️ NUEVO: Obtener el archivo de imagen
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
    // ⬅️ NUEVO: Construir FormData para enviar archivos
    const formData = new FormData();
    formData.append("content", content);

    // Añadir tags como un array de un solo elemento si existe
    if (tagId) {
      formData.append("tags[]", tagId);
    }

    // Añadir la imagen si se seleccionó un archivo
    if (imageFile) {
      formData.append("imageFile", imageFile); // 'imageFile' es el nombre que espera Multer
    }

    // 1. Publica la pregunta
    await postQuestion(formData); // ⬅️ Enviar el objeto FormData

    // 2. Vuelve a cargar el feed para mostrar la nueva pregunta
    await initializeArticleFeed();

    hideAskQuestionModal();
    alert("¡Tu pregunta ha sido publicada!");
  } catch (error) {
    console.error("Error al publicar la pregunta:", error);
    // Mostrar error de validación del backend o de Multer
    errorMessageElement.textContent = error.message;
    errorMessageElement.classList.add("visible");
  }
};
