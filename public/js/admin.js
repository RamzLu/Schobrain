// public/js/admin.js
import { verifyAuth } from "./services/auth.service.js";
import {
  getAllTeacherRequests,
  updateTeacherRequestStatus,
} from "./services/admin.service.js";
import { showSuccessToast, showErrorToast } from "./utils/notifications.js";

// Estado global para filtro actual
let currentFilterStatus = "pending";

const initializeAdminPage = async () => {
  let authData;
  try {
    // 1. Verifica autenticación y permisos
    authData = await verifyAuth();

    if (authData.data.role !== "admin") {
      alert(
        "Acceso denegado: Solo los administradores pueden acceder a esta página."
      );
      window.location.href = "/index.html";
      return;
    }

    // 2. Actualiza el nombre del usuario
    const usernameSpan = document.getElementById("logged-in-username");
    if (usernameSpan && authData && authData.data) {
      usernameSpan.textContent = authData.data.firstName;
    }

    // 3. Cargar solicitudes iniciales (Pendientes por defecto)
    loadRequests(currentFilterStatus);
    setupFilters();
    setupModalLogic();
  } catch (error) {
    console.error("Error de autenticación o permiso:", error);
    window.location.href = "/login.html";
    return;
  }
};

// === LÓGICA DE CARGA Y RENDERIZADO ===

const loadRequests = async (status) => {
  const container = document.getElementById("teacher-requests-list");
  container.innerHTML = '<p style="color:#777;">Cargando...</p>';

  try {
    const requests = await getAllTeacherRequests(status);
    renderRequests(requests, container);
  } catch (error) {
    container.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  }
};

const renderRequests = (requests, container) => {
  container.innerHTML = "";

  if (requests.length === 0) {
    container.innerHTML = "<p>No hay solicitudes en esta categoría.</p>";
    return;
  }

  requests.forEach((req) => {
    const card = document.createElement("div");
    card.className = "request-card";

    // Mapeo de estado para etiquetas visuales
    const statusLabels = {
      pending: { text: "Pendiente", class: "status-pending" },
      review: { text: "En Revisión", class: "status-review" },
      verified: { text: "Verificado", class: "status-verified" },
      rejected: { text: "Rechazado", class: "status-rejected" },
    };
    const statusInfo = statusLabels[req.status] || statusLabels.pending;

    // Generar HTML de documentos
    const docsHtml = req.documents
      .map(
        (docUrl, index) => `
      <button class="doc-link view-doc-btn" data-url="${docUrl}">
        <i class="fas fa-file-alt"></i> Doc ${index + 1}
      </button>
    `
      )
      .join("");

    // Generar Botones según estado
    let actionsHtml = "";
    if (req.status === "pending") {
      actionsHtml = `
        <button class="action-btn btn-review" data-id="${req._id}" data-action="review">
          <i class="fas fa-eye"></i> Empezar Revisión
        </button>
      `;
    } else if (req.status === "review") {
      actionsHtml = `
        <button class="action-btn btn-reject" data-id="${req._id}" data-action="rejected">
          <i class="fas fa-times"></i> Rechazar
        </button>
        <button class="action-btn btn-accept" data-id="${req._id}" data-action="verified">
          <i class="fas fa-check"></i> Verificar
        </button>
      `;
    } else {
      // Si ya está verificado o rechazado, no mostramos botones principales
      actionsHtml = `<span style="color:#777; font-size:0.9rem;">Procesado por Admin</span>`;
    }

    card.innerHTML = `
      <div class="status-badge ${statusInfo.class}">${statusInfo.text}</div>
      <div class="req-header">
        <img src="${
          req.user?.profile?.avatarUrl || "assets/img/default-avatar.png"
        }" class="req-avatar" alt="Avatar">
        <div class="req-info">
          <h3>${req.user?.username || "Usuario"}</h3>
          <span>${req.user?.email || ""}</span>
        </div>
      </div>
      <div class="req-details">
        <p><strong>DNI:</strong> ${req.dni}</p>
        <p><strong>Especialidad:</strong> ${req.specialty}</p>
        <p><strong>Info:</strong> ${req.description || "Sin descripción"}</p>
      </div>
      <div class="req-docs">
        ${docsHtml}
      </div>
      <div class="req-actions">
        ${actionsHtml}
      </div>
    `;

    // Listeners para botones de acción
    const reviewBtn = card.querySelector(".btn-review");
    const acceptBtn = card.querySelector(".btn-accept");
    const rejectBtn = card.querySelector(".btn-reject");

    if (reviewBtn)
      reviewBtn.addEventListener("click", () =>
        handleStatusChange(req._id, "review")
      );
    if (acceptBtn)
      acceptBtn.addEventListener("click", () =>
        handleStatusChange(req._id, "verified")
      );
    if (rejectBtn)
      rejectBtn.addEventListener("click", () => handleReject(req._id));

    // Listeners para ver documentos
    card.querySelectorAll(".view-doc-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        openDocPreview(e.currentTarget.dataset.url);
      });
    });

    container.appendChild(card);
  });
};

// === MANEJO DE ACCIONES ===

const handleStatusChange = async (id, status, comments = "") => {
  try {
    await updateTeacherRequestStatus(id, status, comments);
    showSuccessToast(`Solicitud actualizada a: ${status}`);
    loadRequests(currentFilterStatus); // Recargar lista actual
  } catch (error) {
    showErrorToast(error.message);
  }
};

const handleReject = (id) => {
  // Simple prompt para motivo de rechazo (se podría hacer con un modal mejor)
  const reason = prompt("Indica el motivo del rechazo (opcional):");
  if (reason !== null) {
    // Si no cancela
    handleStatusChange(id, "rejected", reason);
  }
};

// === FILTROS ===

const setupFilters = () => {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update visual classes
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update Logic
      currentFilterStatus = btn.dataset.status;
      loadRequests(currentFilterStatus);
    });
  });
};

// === MODAL PREVIEW ===

const setupModalLogic = () => {
  const modal = document.getElementById("doc-preview-modal");
  const closeBtn = document.getElementById("close-doc-preview");

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("visible");
    document.getElementById("doc-preview-frame").src = ""; // Limpiar src
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("visible");
      document.getElementById("doc-preview-frame").src = "";
    }
  });
};

const openDocPreview = (url) => {
  const modal = document.getElementById("doc-preview-modal");
  const frame = document.getElementById("doc-preview-frame");

  // Ajustar URL si es relativa
  const fullUrl = url.startsWith("http")
    ? url
    : `${window.location.origin}${url}`;

  frame.src = fullUrl;
  modal.classList.add("visible");
};

document.addEventListener("DOMContentLoaded", initializeAdminPage);
