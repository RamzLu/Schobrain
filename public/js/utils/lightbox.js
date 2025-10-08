/**
 * Inicializa la funcionalidad de lightbox para un contenedor específico.
 * Busca enlaces con la clase '.article-image-link' dentro del contenedor.
 * @param {string} containerId - El ID del elemento contenedor donde se buscarán las imágenes.
 */
export function initializeLightbox(containerId) {
  const container = document.getElementById(containerId);
  const modal = document.getElementById("image-preview-modal");
  const previewImage = document.getElementById("preview-image-src");
  const closeBtn = modal ? modal.querySelector(".close-preview-btn") : null;

  if (!container || !modal || !previewImage || !closeBtn) {
    return;
  }

  // --- Abre el modal ---
  container.addEventListener("click", (event) => {
    const link = event.target.closest(".article-image-link");
    if (link) {
      event.preventDefault(); // Evita que el enlace abra una nueva página
      previewImage.src = link.href; // Carga la imagen del enlace en el visor
      modal.classList.add("visible");
    }
  });

  // --- Cierra el modal ---
  const closeModal = () => {
    modal.classList.remove("visible");
  };

  closeBtn.addEventListener("click", closeModal);

  // Cierra el modal si se hace clic en el fondo oscuro
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}
