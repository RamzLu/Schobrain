import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  updateAccount,
  deleteAccount, // <-- RESTAURADA LA IMPORTACIÓN
  toggleFavoriteArticle,
  getFavoriteArticles,
  toggleFavoriteComment, // <-- NUEVA IMPORTACIÓN
  getFavoriteComments, // <-- NUEVA IMPORTACIÓN
} from "../controllers/profile.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import multer from "multer"; // <-- IMPORTACIÓN NECESARIA
import { validator } from "../middlewares/validator.js";
import { param } from "express-validator"; // <-- IMPORTACIÓN NECESARIA

// Configuración básica de Multer
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
  deleteAccount // Usa el controlador
);

// Ruta para actualizar avatar
profileRouter.put(
  "/avatar",
  validateToken,
  upload.single("avatar"), // 'avatar' debe coincidir con el nombre del campo en FormData
  updateAvatar
);

// RUTA ACTUALIZADA para añadir/quitar un artículo de favoritos (PREGUNTAS)
profileRouter.post(
  "/favorites/article/:articleId",
  validateToken,
  // Validación básica del ID del artículo
  param("articleId")
    .isMongoId()
    .withMessage("El ID del artículo no es válido."),
  validator, // Ejecuta la validación
  toggleFavoriteArticle
);

// RUTA ACTUALIZADA para obtener los artículos favoritos (PREGUNTAS)
profileRouter.get("/favorites/articles", validateToken, getFavoriteArticles);

// NUEVA RUTA para añadir/quitar un comentario de favoritos (RESPUESTAS)
profileRouter.post(
  "/favorites/comment/:commentId",
  validateToken,
  // Validación básica del ID del comentario
  param("commentId")
    .isMongoId()
    .withMessage("El ID del comentario no es válido."),
  validator, // Ejecuta la validación
  toggleFavoriteComment
);

// NUEVA RUTA para obtener los comentarios favoritos (RESPUESTAS)
profileRouter.get("/favorites/comments", validateToken, getFavoriteComments);

export default profileRouter;
