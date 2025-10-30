// public/js/article/article.handler.js
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

  // FIX: Obtener el botón de envío
  const submitButton = form.querySelector('button[type="submit"]');

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

  // Deshabilitar el botón para prevenir el doble envío
  const originalText = submitButton ? submitButton.textContent : "PREGUNTAR";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Publicando...";
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

    showSuccessToast("¡Pregunta publicada con éxito!");

    // Se mantiene el timeout para que el usuario vea el mensaje de éxito
    setTimeout(() => {
      window.location.reload();
    }, 900);
  } catch (error) {
    console.error("Error al publicar la pregunta:", error);
    showErrorToast(error.message);
  } finally {
    // FIX: Siempre re-habilitar el botón, incluso si falla o lanza error
    if (submitButton && !submitButton.disabled) {
      // En un escenario normal de éxito, la recarga evita que este 'finally' se ejecute con el valor original.
      // Solo lo re-habilitamos y restauramos el texto si hubo un error de red o de servidor.
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
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
