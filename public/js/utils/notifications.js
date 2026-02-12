/**
 * Muestra una notificación toast con un mensaje y estilo personalizables.
 * @param {string} text - El mensaje a mostrar.
 * @param {'success' | 'error' | 'info'} type - El tipo de notificación.
 */
export const showToast = (text, type = "info") => {
  const backgroundColors = {
    success: "linear-gradient(to right, #00b09b, #96c93d)",
    error: "linear-gradient(to right, #e63946, #f15a63)",
    info: "linear-gradient(to right, #6a11cb, #2575fc)",
  };

  Toastify({
    text: text,
    duration: 4000,
    close: true,
    gravity: "top", // `top` o `bottom`
    position: "right", // `left`, `center` o `right`
    stopOnFocus: true, // Previene que la notificación se cierre al pasar el cursor
    style: {
      background: backgroundColors[type] || backgroundColors.info,
      borderRadius: "8px",
    },
    onClick: function () {}, // Callback al hacer clic
  }).showToast();
};

export const showSuccessToast = (text) => showToast(text, "success");

export const showErrorToast = (text) => showToast(text, "error");
