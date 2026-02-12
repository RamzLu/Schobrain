// public/js/services/teacherRequest.service.js
const API_URL = "/api/teacher-requests";

/**
 * Envía una nueva solicitud de verificación docente.
 * @param {FormData} formData - Datos del formulario (incluyendo archivos).
 * @returns {Promise<Object>} - Respuesta del servidor.
 */
export const createTeacherRequest = async (formData) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      // No establecemos 'Content-Type': 'multipart/form-data' manualmente
      // porque el navegador lo hace automáticamente al detectar FormData
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || "Error al enviar la solicitud.");
    }

    return data;
  } catch (error) {
    console.error("Error en createTeacherRequest:", error);
    throw error;
  }
};
