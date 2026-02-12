// src/routes/teacherRequest.route.js
import { Router } from "express";
import {
  createRequest,
  getAllRequests,
  updateRequestStatus,
} from "../controllers/teacherRequest.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import { uploadDocuments } from "../middlewares/uploadMiddleware.js";
import { authAdmin } from "../middlewares/adminMiddleware.js";

const teacherRequestRouter = Router();

// Ruta para que el usuario envíe su solicitud (con subida de archivos)
// Field name: "documents"
teacherRequestRouter.post("/", validateToken, uploadDocuments, createRequest);

// Ruta para que el admin vea todas las solicitudes
teacherRequestRouter.get("/", validateToken, authAdmin, getAllRequests);

// Ruta para que el admin cambie el estado (Aceptar/Rechazar)
teacherRequestRouter.patch(
  "/:id",
  validateToken,
  authAdmin,
  updateRequestStatus
);

export { teacherRequestRouter };
