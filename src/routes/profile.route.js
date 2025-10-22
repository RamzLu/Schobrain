import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  updateAccount,
} from "../controllers/profile.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import multer from "multer";
import { validator } from "../middlewares/validator.js";

const upload = multer({ dest: "public/uploads/" });

const profileRouter = Router();

profileRouter.get("/", validateToken, getProfile);

// Ruta para actualizar datos del perfil (nombre, apellido, bio, fecha nac, username)
profileRouter.put("/", validateToken, validator, updateProfile);

// Ruta para actualizar email y contraseña
profileRouter.put("/account", validateToken, validator, updateAccount);

profileRouter.put(
  "/avatar",
  validateToken,
  upload.single("avatar"),
  updateAvatar
);

export default profileRouter;
