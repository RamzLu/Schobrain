// File: ramzlu/schobrain/Schobrain-dev-lu/public/js/admin/tag.ui.js

const tagsListContainer = document.getElementById("existing-tags-list");

/**
 * Genera el HTML para una sola etiqueta (Tag).
 * @param {Object} tag - Objeto Tag { _id, name, description }
 * @returns {string} HTML de la tarjeta de la etiqueta.
 */
const renderTagCard = (tag) => {
  return `
    <div class="tag-card" data-id="${tag._id}">
      <div class="tag-info">
        <span class="tag-name">${tag.name}</span>
        <p class="tag-description">${tag.description || "Sin descripción."}</p>
      </div>
      <div class="tag-actions">
        <button class="delete-tag-btn" data-tag-id="${
          tag._id
        }" title="Eliminar etiqueta">
            <i class="fas fa-trash-alt"></i> 
        </button>
      </div>
    </div>
  `;
};

/**
 * Muestra la lista de etiquetas existentes en el contenedor.
 * @param {Array<Object>} tags - Lista de tags.
 */
export const loadExistingTags = (tags) => {
  if (tagsListContainer) {
    if (tags.length === 0) {
      tagsListContainer.innerHTML = `<p style="text-align: center; color: #888; padding: 1rem;">No hay etiquetas creadas aún.</p>`;
      return;
    }
    const tagsHtml = tags.map(renderTagCard).join("");
    tagsListContainer.innerHTML = tagsHtml;
  }
};
