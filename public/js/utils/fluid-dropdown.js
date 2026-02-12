/*
 * ==========================================================================
 * NUEVO ARCHIVO: public/js/utils/fluid-dropdown.js
 * ==========================================================================
 */

/**
 * Mapeo de nombres de asignaturas (tags) a íconos de FontAwesome y colores.
 * Los nombres deben coincidir con los de tu base de datos / `database.js`.
 * Los íconos se toman de tu `index.html`.
 * Los colores se toman del ejemplo de React que proporcionaste.
 */
const tagIconMap = {
  // --- Tags del ejemplo de React ---
  Matemáticas: { icon: "fas fa-calculator", color: "#8B5CF6" },
  Física: { icon: "fas fa-atom", color: "#EC4899" }, // React usaba 'Microscope'
  Geografía: { icon: "fas fa-globe-africa", color: "#06B6D4" },
  Musica: { icon: "fas fa-music", color: "#F59E0B" },

  // --- Otros tags de tu proyecto ---
  Lengua: { icon: "fas fa-language", color: "#10B981" },
  Ciencias: { icon: "fas fa-flask", color: "#EF4444" },
  Historia: { icon: "fas fa-book-open", color: "#D97706" },
  Programación: { icon: "fas fa-code", color: "#6366F1" },
  "Estadísticas y Cálculo": { icon: "fas fa-chart-line", color: "#0EA5E9" },
  Castellano: { icon: "fas fa-spell-check", color: "#10B981" },
  Inglés: { icon: "fas fa-globe", color: "#14B8A6" },
  "Ciencias Sociales": { icon: "fas fa-users", color: "#A16207" },
  Derecho: { icon: "fas fa-gavel", color: "#4B5563" },
  Contabilidad: { icon: "fas fa-file-invoice-dollar", color: "#059669" },
  Química: { icon: "fas fa-vial", color: "#84CC16" },
  Salud: { icon: "fas fa-heartbeat", color: "#EC4899" },
  Biología: { icon: "fas fa-dna", color: "#22C55E" },
  Informática: { icon: "fas fa-desktop", color: "#3B82F6" },
  "Tecnología y Electrónica": { icon: "fas fa-microchip", color: "#6366F1" },
  Religión: { icon: "fas fa-cross", color: "#F59E0B" },
  Filosofía: { icon: "fas fa-brain", color: "#A855F7" },
  Psicología: { icon: "fas fa-comment-dots", color: "#F472B6" },
  "Educ. Fisica": { icon: "fas fa-futbol", color: "#22C55E" },
  Arte: { icon: "fas fa-palette", color: "#7E22CE" },
  Francés: { icon: "fas fa-language", color: "#0EA5E9" },
  Alemán: { icon: "fas fa-language", color: "#64748B" },
  "Latín / Griego": { icon: "fas fa-scroll", color: "#854D0E" },
  "Análisis de la materia y la energía": {
    icon: "fas fa-burn",
    color: "#F97316",
  },
  "Tratamiento de datos y azar": {
    icon: "fas fa-dice",
    color: "#6366F1",
  },
  // Default/Fallback
  default: { icon: "fas fa-book-open", color: "#3B82F6" },
};

/**
 * Obtiene el ícono y color para un nombre de tag.
 * @param {string} tagName - El nombre del tag (ej. "Matemáticas")
 * @returns {{icon: string, color: string}}
 */
function getTagStyle(tagName) {
  return tagIconMap[tagName] || tagIconMap.default;
}

/**
 * Inicializa un <select> único para convertirlo en un Fluid Dropdown.
 * @param {HTMLSelectElement} selectElement - El elemento <select> original.
 */
function initializeFluidDropdown(selectElement) {
  // 1. Ocultar el select original
  selectElement.classList.add("fluid-select-target");

  // 2. Crear la estructura del Dropdown
  const wrapper = document.createElement("div");
  wrapper.className = "fluid-dropdown-wrapper";
  // Guardamos una referencia al ID del select original
  wrapper.dataset.targetSelectId = selectElement.id;

  // 3. Crear el botón principal (Trigger)
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "fluid-dropdown-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const triggerContent = document.createElement("span");
  triggerContent.className = "fluid-dropdown-trigger-content";
  trigger.appendChild(triggerContent);

  const triggerIconWrapper = document.createElement("span");
  triggerIconWrapper.className = "fluid-dropdown-icon-wrapper";
  triggerIconWrapper.innerHTML = `<i class="${tagIconMap.default.icon}"></i>`; // Icono por defecto
  triggerIconWrapper.style.setProperty(
    "--icon-color",
    tagIconMap.default.color
  );
  triggerContent.appendChild(triggerIconWrapper);

  const triggerLabel = document.createElement("span");
  triggerLabel.className = "fluid-dropdown-label";
  triggerLabel.textContent = "Selecciona una asignatura"; // Texto por defecto
  triggerContent.appendChild(triggerLabel);

  const chevron = document.createElement("span");
  chevron.className = "fluid-dropdown-chevron";
  chevron.innerHTML = `<i class="fas fa-chevron-down"></i>`;
  trigger.appendChild(chevron);

  // 4. Crear el panel de opciones
  const panel = document.createElement("div");
  panel.className = "fluid-dropdown-panel";
  panel.setAttribute("role", "listbox");

  const list = document.createElement("div");
  list.className = "fluid-dropdown-list";
  panel.appendChild(list);

  const highlight = document.createElement("div");
  highlight.className = "fluid-dropdown-highlight";
  highlight.setAttribute("aria-hidden", "true");
  list.appendChild(highlight); // El resaltado va DENTRO de la lista

  // 5. Insertar la nueva estructura en el DOM
  // Inserta el wrapper justo después del select original
  selectElement.parentNode.insertBefore(wrapper, selectElement.nextSibling);
  wrapper.appendChild(trigger);
  wrapper.appendChild(panel);

  /**
   * Actualiza el botón principal (trigger) con el texto e ícono de un item.
   * @param {string} text - El texto de la opción.
   * @param {string} value - El valor (ID) de la opción.
   */
  function updateTrigger(text, value) {
    const style = getTagStyle(text);
    triggerLabel.textContent = text;
    triggerIconWrapper.innerHTML = `<i class="${style.icon}"></i>`;
    triggerIconWrapper.style.setProperty("--icon-color", style.color);

    // Si el valor está vacío (opción "Selecciona..."), color por defecto
    if (!value) {
      triggerIconWrapper.style.setProperty(
        "--icon-color",
        tagIconMap.default.color
      );
    }
  }

  /**
   * Rellena la lista de opciones basándose en el <select> original.
   */
  function populateOptions() {
    // Limpiar opciones antiguas (excepto el highlight)
    list
      .querySelectorAll(".fluid-dropdown-item, .fluid-dropdown-separator")
      .forEach((el) => el.remove());

    const options = Array.from(selectElement.options);
    let selectedOption = null;

    options.forEach((option, index) => {
      // 5a. Crear el botón para el item
      const item = document.createElement("button");
      item.type = "button";
      item.className = "fluid-dropdown-item";
      item.dataset.value = option.value;
      item.setAttribute("role", "option");

      const style = getTagStyle(option.text);

      const iconWrapper = document.createElement("span");
      iconWrapper.className = "fluid-dropdown-icon-wrapper";
      iconWrapper.innerHTML = `<i class="${style.icon}"></i>`;
      // Guardamos el color en una variable CSS para el :hover
      item.style.setProperty("--icon-color", style.color);

      const label = document.createElement("span");
      label.textContent = option.text;

      item.appendChild(iconWrapper);
      item.appendChild(label);
      list.appendChild(item);

      // 5b. Añadir separador (como en el ejemplo de React)
      if (index === 0 && options.length > 1) {
        const separator = document.createElement("hr");
        separator.className = "fluid-dropdown-separator";
        list.appendChild(separator);
      }

      // 5c. Actualizar el trigger si esta es la opción seleccionada
      if (option.value === selectElement.value || option.selected) {
        selectedOption = option;
      }
    });

    // Actualizar el trigger con la opción seleccionada o la primera opción
    const optionToDisplay = selectedOption || options[0];
    if (optionToDisplay) {
      updateTrigger(optionToDisplay.text, optionToDisplay.value);
    }
  }

  // 6. Lógica de Eventos

  // Abrir/Cerrar
  trigger.addEventListener("click", () => {
    const isOpen = wrapper.classList.toggle("open");
    trigger.setAttribute("aria-expanded", isOpen);
  });

  // Cerrar al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });

  // Mover el resaltado "fluido" al pasar el ratón
  list.addEventListener("mouseover", (e) => {
    const item = e.target.closest(".fluid-dropdown-item");
    if (item) {
      highlight.style.opacity = "1";
      highlight.style.height = `${item.offsetHeight}px`;
      // Usamos offsetTop para saber a qué altura mover el resaltado
      highlight.style.transform = `translateY(${item.offsetTop}px)`;
    }
  });

  // Quitar el resaltado al sacar el ratón de la lista
  list.addEventListener("mouseleave", () => {
    highlight.style.opacity = "0";
  });

  // Seleccionar un item
  list.addEventListener("click", (e) => {
    const item = e.target.closest(".fluid-dropdown-item");
    if (item) {
      const value = item.dataset.value;
      const text = item.textContent;

      // 6a. Actualizar el <select> original (¡Importante!)
      selectElement.value = value;
      // Disparamos un evento 'change' por si otro JS depende de él
      selectElement.dispatchEvent(new Event("change"));

      // 6b. Actualizar el botón principal (Trigger)
      updateTrigger(text, value);

      // 6c. Cerrar el dropdown
      wrapper.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });

  // 7. Rellenar las opciones por primera vez
  populateOptions();

  // 8. Observar el <select> original por si cambia (ej. `populateTagSelector`)
  // Si las opciones del <select> original cambian, repoblamos el dropdown.
  const observer = new MutationObserver((mutations) => {
    // Nos interesa si cambian los hijos (options)
    if (mutations.some((m) => m.type === "childList")) {
      populateOptions();
    }
  });

  observer.observe(selectElement, {
    childList: true, // Observar adición/eliminación de <option>
  });
}

/**
 * Inicializa todos los dropdowns de la página que tengan la clase de destino.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Busca todos los <select> que quieras reemplazar
  const selectsToReplace = document.querySelectorAll(".fluid-select-target");
  selectsToReplace.forEach(initializeFluidDropdown);

  // También podemos inicializar por ID, por si la clase aún no está
  const tagSelect = document.getElementById("tag-select");
  const editTagSelect = document.getElementById("edit-tag-select");

  if (tagSelect && !tagSelect.classList.contains("fluid-select-target")) {
    initializeFluidDropdown(tagSelect);
  }
  if (
    editTagSelect &&
    !editTagSelect.classList.contains("fluid-select-target")
  ) {
    initializeFluidDropdown(editTagSelect);
  }
});

// Opcional: Exponer la función globalmente si es necesario
// window.initializeFluidDropdown = initializeFluidDropdown;
