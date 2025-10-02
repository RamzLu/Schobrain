// Clase para gestionar el perfil
class ProfileManager {
  constructor() {
    this.profileData = this.loadProfileData();
    this.init();
  }

  // Inicializar la aplicación
  init() {
    this.setupEventListeners();
    this.renderProfile();
    this.setupAutoSave();
  }

  // Cargar datos del perfil desde localStorage
  loadProfileData() {
    const savedData = localStorage.getItem("profileData");
    if (savedData) {
      return JSON.parse(savedData);
    }

    // Datos por defecto
    return {
      name: "Juan Pérez",
      tagline: "Desarrollador Web Full Stack",
      about: `<p>Soy un desarrollador web apasionado por crear soluciones innovadoras. Me encanta aprender nuevas tecnologías y trabajar en equipo para alcanzar objetivos comunes.</p><p>En mi tiempo libre disfruto del senderismo, la fotografía y leer libros de ciencia ficción.</p>`,
      skills: ["JavaScript", "React", "Node.js", "HTML5", "CSS3", "Git"],
      experience: `<div class="experience-item">
                <h3>Desarrollador Frontend Senior</h3>
                <p class="company">Tech Solutions Inc.</p>
                <p class="date">2020 - Presente</p>
                <p>Lideré el desarrollo de aplicaciones web usando React y TypeScript. Colaboré con equipos de diseño para implementar interfaces de usuario responsivas.</p>
            </div>
            <div class="experience-item">
                <h3>Desarrollador Web Junior</h3>
                <p class="company">Digital Agency</p>
                <p class="date">2018 - 2020</p>
                <p>Desarrollé sitios web para diversos clientes usando HTML, CSS y JavaScript. Participé en proyectos de e-commerce y landing pages.</p>
            </div>`,
      contact: {
        email: "juan.perez@ejemplo.com",
        phone: "+34 612 345 678",
        location: "Madrid, España",
      },
      profileImage:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    };
  }

  // Configurar event listeners
  setupEventListeners() {
    // Cambio de foto de perfil
    document.getElementById("imageUpload").addEventListener("change", (e) => {
      this.handleImageUpload(e);
    });

    // Añadir nueva habilidad
    document.getElementById("addSkillBtn").addEventListener("click", () => {
      this.addSkill();
    });

    // Añadir habilidad con Enter
    document
      .getElementById("newSkillInput")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.addSkill();
        }
      });

    // Eliminar habilidad (event delegation)
    document
      .getElementById("skillsContainer")
      .addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-skill")) {
          const skill = e.target
            .closest(".skill")
            .querySelector("span").textContent;
          this.removeSkill(skill);
        }
      });
  }

  // Configurar guardado automático
  setupAutoSave() {
    const editableElements = document.querySelectorAll(
      '[contenteditable="true"]'
    );

    editableElements.forEach((element) => {
      element.addEventListener("blur", () => {
        this.saveProfile();
      });

      element.addEventListener(
        "input",
        this.debounce(() => {
          element.classList.add("editing");
        }, 300)
      );
    });
  }

  // Función debounce para optimizar el rendimiento
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Renderizar el perfil con los datos actuales
  renderProfile() {
    // Información básica
    document.getElementById("profileName").textContent = this.profileData.name;
    document.getElementById("profileTagline").textContent =
      this.profileData.tagline;
    document.getElementById("profileImage").src = this.profileData.profileImage;

    // Sobre mí
    document.getElementById("aboutContent").innerHTML = this.profileData.about;

    // Habilidades
    this.renderSkills();

    // Experiencia
    document.getElementById("experienceContent").innerHTML =
      this.profileData.experience;

    // Contacto
    this.renderContact();
  }

  // Renderizar habilidades
  renderSkills() {
    const skillsContainer = document.getElementById("skillsContainer");
    skillsContainer.innerHTML = "";

    this.profileData.skills.forEach((skill) => {
      const skillElement = document.createElement("div");
      skillElement.className = "skill";
      skillElement.innerHTML = `
                <span>${skill}</span>
                <button class="remove-skill" title="Eliminar habilidad">×</button>
            `;
      skillsContainer.appendChild(skillElement);
    });
  }

  // Renderizar información de contacto
  renderContact() {
    const contactItems = document.querySelectorAll(".contact-item");

    contactItems.forEach((item, index) => {
      const valueElement = item.querySelector(".contact-value");
      const labels = ["email", "phone", "location"];

      if (valueElement && this.profileData.contact[labels[index]]) {
        valueElement.textContent = this.profileData.contact[labels[index]];
      }
    });
  }

  // Manejar subida de imagen
  handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileData.profileImage = e.target.result;
        document.getElementById("profileImage").src = e.target.result;
        this.saveProfile();
      };
      reader.readAsDataURL(file);
    }
  }

  // Añadir nueva habilidad
  addSkill() {
    const input = document.getElementById("newSkillInput");
    const skillText = input.value.trim();

    if (skillText && !this.profileData.skills.includes(skillText)) {
      this.profileData.skills.push(skillText);
      this.renderSkills();
      input.value = "";
      this.saveProfile();
    }
  }

  // Eliminar habilidad
  removeSkill(skill) {
    this.profileData.skills = this.profileData.skills.filter(
      (s) => s !== skill
    );
    this.renderSkills();
    this.saveProfile();
  }

  // Guardar perfil en localStorage
  saveProfile() {
    // Actualizar datos desde los elementos editables
    this.profileData.name = document.getElementById("profileName").textContent;
    this.profileData.tagline =
      document.getElementById("profileTagline").textContent;
    this.profileData.about = document.getElementById("aboutContent").innerHTML;
    this.profileData.experience =
      document.getElementById("experienceContent").innerHTML;

    // Actualizar información de contacto
    const contactItems = document.querySelectorAll(".contact-item");
    const contactLabels = ["email", "phone", "location"];

    contactItems.forEach((item, index) => {
      const valueElement = item.querySelector(".contact-value");
      if (valueElement) {
        this.profileData.contact[contactLabels[index]] =
          valueElement.textContent;
      }
    });

    // Guardar en localStorage
    localStorage.setItem("profileData", JSON.stringify(this.profileData));

    // Mostrar feedback visual
    this.showSaveFeedback();
  }

  // Mostrar feedback de guardado
  showSaveFeedback() {
    const footer = document.querySelector(".profile-footer");
    const originalText = footer.textContent;

    footer.textContent = "✓ Cambios guardados";
    footer.style.color = "#059669";

    setTimeout(() => {
      footer.textContent = originalText;
      footer.style.color = "";
    }, 2000);
  }
}

// Inicializar la aplicación cuando se cargue la página
document.addEventListener("DOMContentLoaded", () => {
  new ProfileManager();
});

// Exportar para uso global (si es necesario)
window.ProfileManager = ProfileManager;
