// public/js/services/admin.service.js

const API_URL = "/api/teacher-requests";

/**
 * Obtiene todas las solicitudes de docentes, opcionalmente filtradas por estado.
 * @param {string} status - (Opcional) 'pending', 'review', 'verified', 'rejected'
 * @returns {Promise<Array>} Lista de solicitudes
 */
export const getAllTeacherRequests = async (status = "") => {
  try {
    // Construir URL con query param si existe status
    const url = status ? `${API_URL}?status=${status}` : API_URL;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // El token se envía automáticamente en cookies o headers según tu config
        // Si usas headers manuales en auth.service, asegúrate de replicarlo aquí
        // Asumiendo cookie o manejo global:
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || "Error al obtener las solicitudes.");
    }
    return data;
  } catch (error) {
    console.error("Error en getAllTeacherRequests:", error);
    throw error;
  }
};

/**
 * Actualiza el estado de una solicitud (Aprobar, Rechazar, Poner en revisión).
 * @param {string} requestId - ID de la solicitud
 * @param {string} newStatus - 'review', 'verified', 'rejected'
 * @param {string} adminComments - Comentarios opcionales del admin
 */
export const updateTeacherRequestStatus = async (
  requestId,
  newStatus,
  adminComments = ""
) => {
  try {
    const response = await fetch(`${API_URL}/${requestId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus, adminComments }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || "Error al actualizar la solicitud.");
    }
    return data;
  } catch (error) {
    console.error("Error en updateTeacherRequestStatus:", error);
    throw error;
  }
};
