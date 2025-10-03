// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/article/article.handler.js

import {
  postQuestion,
  fetchAllArticles,
  fetchArticlesByTag,
  deleteArticle, // Importamos la nueva función
} from "../services/article.service.js";
import { fetchAllTags } from "../services/tag.service.js";
import {
  hideAskQuestionModal,
  loadArticles,
  populateTagSelector,
} from "./article.ui.js";

// Llama a la API para obtener y mostrar todos los artículos al cargar la página
export const initializeArticleFeed = async (currentUser) => {
  try {
    const articles = await fetchAllArticles();
    // Pasamos el usuario actual para que la UI sepa qué renderizar
    loadArticles(articles, currentUser);

    const tags = await fetchAllTags();
    populateTagSelector(tags);
  } catch (error) {
    console.error("Error al cargar el feed o tags:", error);
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
  const imageFile = form["imageFile"].files[0];
  const errorMessageElement = document.getElementById("question-error-message");

  errorMessageElement.classList.remove("visible");
  errorMessageElement.textContent = "";

  if (!content || content.length < 10) {
    errorMessageElement.textContent =
      "El contenido debe tener al menos 10 caracteres.";
    errorMessageElement.classList.add("visible");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("content", content);
    if (tagId) formData.append("tags[]", tagId);
    if (imageFile) formData.append("imageFile", imageFile);

    await postQuestion(formData);
    // Vuelve a cargar el feed después de publicar
    window.location.reload(); // Recarga la página para mostrar los cambios
  } catch (error) {
    console.error("Error al publicar la pregunta:", error);
    errorMessageElement.textContent = error.message;
    errorMessageElement.classList.add("visible");
  }
};

// Filtra los artículos por etiqueta
export const filterArticlesByTag = async (tagName, currentUser) => {
  try {
    let articles;
    if (tagName === "all") {
      articles = await fetchAllArticles();
    } else {
      articles = await fetchArticlesByTag(tagName);
    }
    loadArticles(articles, currentUser);
  } catch (error) {
    console.error(`Error al filtrar por ${tagName}:`, error);
  }
};

// Maneja el borrado de un artículo
export const handleDeleteArticle = async (articleId) => {
  try {
    await deleteArticle(articleId);
    alert("Pregunta eliminada correctamente.");
    window.location.reload(); // Recargamos para ver los cambios
  } catch (error) {
    console.error("Error al eliminar la pregunta:", error);
    alert(error.message);
  }
};
