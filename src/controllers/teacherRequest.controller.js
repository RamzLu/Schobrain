// src/controllers/teacherRequest.controller.js
import { TeacherRequestModel } from "../models/teacherRequest.model.js";
import { UserModel } from "../models/user.model.js";

// === USUARIO: CREAR SOLICITUD ===
export const createRequest = async (req, res) => {
  try {
    const { dni, specialty, description } = req.body;
    const userId = req.userLog.id;

    // Verificar si ya tiene una solicitud pendiente o verificada
    const user = await UserModel.findById(userId);
    if (user.teacherStatus === "pending" || user.teacherStatus === "verified") {
      return res.status(400).json({
        msg: "Ya tienes una solicitud en proceso o ya estás verificado.",
      });
    }

    // Procesar archivos subidos
    let documentPaths = [];
    if (req.files && req.files.length > 0) {
      documentPaths = req.files.map((file) => `/uploads/${file.filename}`);
    } else {
      return res
        .status(400)
        .json({ msg: "Debes subir al menos un documento probatorio." });
    }

    // Crear la solicitud
    const newRequest = new TeacherRequestModel({
      user: userId,
      dni,
      specialty,
      description,
      documents: documentPaths,
      status: "pending",
    });

    await newRequest.save();

    // Actualizar estado del usuario a 'pending'
    user.teacherStatus = "pending";
    await user.save();

    res.status(201).json({
      msg: "Solicitud enviada con éxito. Espera la revisión de un administrador.",
      request: newRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear la solicitud.", error });
  }
};

// === ADMIN: OBTENER TODAS LAS SOLICITUDES ===
export const getAllRequests = async (req, res) => {
  try {
    const { status } = req.query; // Filtrar por estado opcionalmente ?status=pending
    const filter = status ? { status } : {};

    const requests = await TeacherRequestModel.find(filter)
      .populate("user", "username email profile teacherStatus") // Traer datos del usuario
      .sort({ createdAt: -1 }); // Más recientes primero

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener solicitudes.", error });
  }
};

// === ADMIN: ACTUALIZAR ESTADO (APROBAR/RECHAZAR/REVISIÓN) ===
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params; // ID de la solicitud (TeacherRequest)
    const { status, adminComments } = req.body; // status: 'review', 'verified', 'rejected'
    const adminId = req.userLog.id;

    if (!["pending", "review", "verified", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Estado no válido." });
    }

    const request = await TeacherRequestModel.findById(id);
    if (!request) {
      return res.status(404).json({ msg: "Solicitud no encontrada." });
    }

    // Actualizar solicitud
    request.status = status;
    request.adminComments = adminComments || "";
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    // Sincronizar estado en el Usuario
    const user = await UserModel.findById(request.user);
    if (user) {
      user.teacherStatus = status;
      await user.save();
    }

    res.status(200).json({
      msg: `Solicitud actualizada a: ${status}`,
      request,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar la solicitud.", error });
  }
};
