// public/js/admin.js
import { verifyAuth } from "./services/auth.service.js";
import {
  getAllTeacherRequests,
  updateTeacherRequestStatus,
} from "./services/admin.service.js";
import { showSuccessToast, showErrorToast } from "./utils/notifications.js";

// Estado global para filtro actual y modal de rechazo
let currentFilterStatus = "pending";
let currentRequestIdToReject = null;

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
    setupRejectModalLogic(); // Nueva función para el modal de rechazo
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

    // --- NUEVO: Generar botones para ver DNI (Frente y Reverso) ---
    let dniHtml = "";
    if (req.dniFront) {
      dniHtml += `
        <button class="doc-link view-doc-btn" data-url="${req.dniFront}" title="Ver Frente DNI" style="border-color: #6a11cb; color: #6a11cb;">
          <i class="fas fa-id-card"></i> Frente
        </button>
      `;
    }
    if (req.dniBack) {
      dniHtml += `
        <button class="doc-link view-doc-btn" data-url="${req.dniBack}" title="Ver Reverso DNI" style="border-color: #6a11cb; color: #6a11cb;">
          <i class="fas fa-id-card"></i> Reverso
        </button>
      `;
    }

    // Generar HTML de documentos adicionales (Títulos)
    const docsHtml = req.documents
      .map(
        (docUrl, index) => `
      <button class="doc-link view-doc-btn" data-url="${docUrl}">
        <i class="fas fa-file-alt"></i> Título ${index + 1}
      </button>
    `
      )
      .join("");

    // Unir todo (DNI primero, luego títulos)
    const allDocsHtml = dniHtml + docsHtml;

    // Generar Botones de acción según estado
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
      // Si ya está verificado o rechazado, mostrar feedback
      let feedbackHtml = "";
      if (req.adminComments) {
        feedbackHtml = `<div style="margin-top:10px; font-size:0.85rem; color:#666; background:#f9f9f9; padding:5px; border-radius:5px;">
          <strong>Nota Admin:</strong> ${req.adminComments}
        </div>`;
      }
      actionsHtml = `<span style="color:#777; font-size:0.9rem;">Procesado por Admin</span>${feedbackHtml}`;
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
        <p><strong>DNI N°:</strong> ${req.dni}</p>
        <p><strong>Especialidad:</strong> ${req.specialty}</p>
        <p><strong>Info:</strong> ${req.description || "Sin descripción"}</p>
      </div>
      
      <div class="req-docs" style="flex-direction: column; gap: 5px; align-items: flex-start;">
        <strong style="font-size: 0.85rem; margin-bottom: 5px;">Documentación:</strong>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${
            allDocsHtml ||
            "<span style='color: #999; font-size: 0.8rem;'>Sin archivos adjuntos</span>"
          }
        </div>
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
      rejectBtn.addEventListener("click", () => openRejectModal(req._id));

    // Listeners para ver documentos (funciona tanto para DNI como para Títulos)
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

// === MODAL RECHAZO ===

const setupRejectModalLogic = () => {
  const modal = document.getElementById("reject-request-modal");
  const form = document.getElementById("reject-form");
  const cancelBtn = document.getElementById("cancel-reject-btn");
  const selectReason = document.getElementById("reject-reason-select");
  const textarea = document.getElementById("reject-comment");

  // Cerrar modal
  const closeModal = () => {
    modal.classList.remove("visible");
    currentRequestIdToReject = null;
    form.reset();
  };

  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Lógica para el select: copia el texto al textarea
  selectReason.addEventListener("change", (e) => {
    const selectedReason = e.target.value;
    if (selectedReason) {
      // Si ya hay texto, añade el motivo seleccionado al final
      const currentText = textarea.value.trim();
      if (currentText.length > 0) {
        textarea.value = currentText + "\n" + selectedReason;
      } else {
        textarea.value = selectedReason;
      }
    }
  });

  // Manejo del envío del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const comments = textarea.value.trim();

    if (!comments) {
      showErrorToast("Por favor, ingresa un motivo para el rechazo.");
      return;
    }

    if (currentRequestIdToReject) {
      await handleStatusChange(currentRequestIdToReject, "rejected", comments);
      closeModal();
    }
  });
};

const openRejectModal = (id) => {
  currentRequestIdToReject = id;
  const modal = document.getElementById("reject-request-modal");
  modal.classList.add("visible");
};

document.addEventListener("DOMContentLoaded", initializeAdminPage);
