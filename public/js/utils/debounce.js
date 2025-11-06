/**
 * Crea una versión "debounced" de una función.
 * La función se retrasa `delay` ms después de la última vez que fue invocada.
 * @param {Function} func - La función a ejecutar.
 * @param {number} delay - El tiempo de espera en milisegundos.
 * @returns {Function} La nueva función "debounced".
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}
