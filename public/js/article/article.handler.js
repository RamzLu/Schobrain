import {
  postQuestion,
  fetchAllArticles,
  fetchArticlesByTag,
  deleteArticle,
} from "../services/article.service.js";
import { fetchAllTags } from "../services/tag.service.js";
import { loadArticles, populateTagSelector } from "./article.ui.js";

export const initializeArticleFeed = async (currentUser) => {
  try {
    const articles = await fetchAllArticles();
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

export const handlePostQuestion = async (event) => {
  event.preventDefault();
  const form = event.target;
  const content = form["content"].value.trim();
  const tagId = form["tags"].value;
  const imageFiles = form["imageFiles"].files;
  const errorMessageElement = document.getElementById("question-error-message");

  errorMessageElement.classList.remove("visible");
  errorMessageElement.textContent = "";

  if (!content || content.length < 10) {
    errorMessageElement.textContent =
      "El contenido debe tener al menos 10 caracteres.";
    errorMessageElement.classList.add("visible");
    return;
  }

  if (imageFiles.length > 5) {
    errorMessageElement.textContent = "Puedes subir un máximo de 5 imágenes.";
    errorMessageElement.classList.add("visible");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("content", content);

    // ✅ CORRECCIÓN DEFINITIVA: Se envía el tag como un elemento de un array.
    if (tagId) {
      formData.append("tags", tagId); // Multer y express-validator lo interpretarán correctamente.
    }

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        formData.append("imageFiles", file);
      }
    }

    await postQuestion(formData);
    window.location.reload();
  } catch (error) {
    console.error("Error al publicar la pregunta:", error);
    errorMessageElement.textContent = error.message;
    errorMessageElement.classList.add("visible");
  }
};

export const filterArticlesByTag = async (tagName, currentUser) => {
  try {
    let articles =
      tagName === "all"
        ? await fetchAllArticles()
        : await fetchArticlesByTag(tagName);
    loadArticles(articles, currentUser);
  } catch (error) {
    console.error(`Error al filtrar por ${tagName}:`, error);
  }
};

export const handleDeleteArticle = async (articleId) => {
  try {
    await deleteArticle(articleId);
    alert("Pregunta eliminada correctamente.");
    window.location.reload();
  } catch (error) {
    console.error("Error al eliminar la pregunta:", error);
    alert(error.message);
  }
};
