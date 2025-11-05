import { Router } from "express";
import {
  deleteUser,
  getAllUsers,
  getPublicUserProfileById, // <-- 1. Importar la nueva función
  getUserById,
  updateUser,
} from "../controllers/user.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import { authAdmin } from "../middlewares/adminMiddleware.js";
import {
  deleteUserValidation,
  getUserByIdValidation,
  updateUserValidation,
} from "../middlewares/validations/user.validations.js";
import { validator } from "../middlewares/validator.js";

export const routeUser = Router();

// --- INICIO DE LA MODIFICACIÓN ---
// 2. Añadir la nueva ruta pública (sin middlewares de autenticación)
routeUser.get("/users/:id/public", getPublicUserProfileById);
// --- FIN DE LA MODIFICACIÓN ---

routeUser.delete(
  "/users/:id",
  validateToken,
  authAdmin,
  deleteUserValidation,
  validator,
  deleteUser
);
routeUser.get("/users", validateToken, authAdmin, getAllUsers);
routeUser.get(
  "/users/:id",
  validateToken,
  authAdmin,
  getUserByIdValidation,
  validator,
  getUserById
);
routeUser.put(
  "/users/:id",
  validateToken,
  authAdmin,
  updateUserValidation,
  validator,
  updateUser
);
