import {
  postQuestion,
  fetchAllArticles,
  fetchArticlesByTag,
  deleteArticle,
} from "../services/article.service.js";
import { fetchAllTags } from "../services/tag.service.js";
import { loadArticles, populateTagSelector } from "./article.ui.js";
import { showSuccessToast, showErrorToast } from "../utils/notifications.js";

export const initializeArticleFeed = async (currentUser) => {
  try {
    const articles = await fetchAllArticles();
    loadArticles(articles, currentUser);
    const tags = await fetchAllTags();
    populateTagSelector(tags);
  } catch (error) {
    console.error("Error al cargar el feed o tags:", error);
    showErrorToast(`Error al cargar las preguntas: ${error.message}`);
  }
};

export const handlePostQuestion = async (event) => {
  event.preventDefault();
  const form = event.target;
  const content = form["content"].value.trim();
  const tagId = form["tags"].value;
  const imageFiles = form["imageFiles"].files;

  // Validaciones del frontend con toasts
  if (!content || content.length < 10) {
    showErrorToast("El contenido debe tener al menos 10 caracteres.");
    return;
  }
  if (!tagId) {
    showErrorToast("Por favor, selecciona una asignatura.");
    return;
  }
  if (imageFiles.length > 5) {
    showErrorToast("Puedes subir un máximo de 5 imágenes.");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("tags", tagId);

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        formData.append("imageFiles", file);
      }
    }

    await postQuestion(formData);

    // ✅ CAMBIO 1: Mostrar notificación de éxito y esperar antes de recargar.
    showSuccessToast("¡Pregunta publicada con éxito!");

    setTimeout(() => {
      window.location.reload();
    }, 900); // 1.5 segundos de espera para que se vea el toast
  } catch (error) {
    console.error("Error al publicar la pregunta:", error);
    showErrorToast(error.message);
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
    showErrorToast(`Error al filtrar: ${error.message}`);
  }
};

export const handleDeleteArticle = async (articleId) => {
  try {
    await deleteArticle(articleId);
    showSuccessToast("Pregunta eliminada correctamente.");
    setTimeout(() => {
      window.location.reload();
    }, 900);
  } catch (error) {
    console.error("Error al eliminar la pregunta:", error);
    showErrorToast(error.message);
  }
};
