import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  updateAccount,
  deleteAccount,
  toggleFavoriteArticle, // Importa el nuevo controlador
  getFavoriteArticles, // Importa el nuevo controlador
} from "../controllers/profile.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import multer from "multer";
import { validator } from "../middlewares/validator.js";
import { param } from "express-validator"; // Importa param para validación

// Configuración básica de Multer (puedes ajustarla según necesites)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const extension = file.originalname.split(".").pop();
    cb(null, `avatar-${req.userLog.id}-${Date.now()}.${extension}`);
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen."), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite 5MB
});

const profileRouter = Router();

profileRouter.get("/", validateToken, getProfile);

// Ruta para actualizar datos del perfil (nombre, apellido, bio, fecha nac, username)
profileRouter.put("/", validateToken, validator, updateProfile);

// Ruta para actualizar email y contraseña
profileRouter.put("/account", validateToken, validator, updateAccount);

// Ruta para eliminar la cuenta
profileRouter.delete(
  "/account",
  validateToken,
  deleteAccount // Usa el nuevo controlador
);

// Ruta para actualizar avatar
profileRouter.put(
  "/avatar",
  validateToken,
  upload.single("avatar"), // 'avatar' debe coincidir con el nombre del campo en FormData
  updateAvatar
);

// NUEVA RUTA para añadir/quitar un artículo de favoritos
profileRouter.post(
  "/favorites/:articleId",
  validateToken,
  // Validación básica del ID del artículo
  param("articleId")
    .isMongoId()
    .withMessage("El ID del artículo no es válido."),
  validator, // Ejecuta la validación
  toggleFavoriteArticle
);

// NUEVA RUTA para obtener los artículos favoritos
profileRouter.get("/favorites", validateToken, getFavoriteArticles);

export default profileRouter;
