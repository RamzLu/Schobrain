import { ArticleModel } from "../../models/article.model.js";
import { TagModel } from "../../models/tag.model.js";
import { UserModel } from "../../models/user.model.js";
import { body, param } from "express-validator";

export const createArticleValidation = [
  body("content")
    .notEmpty()
    .withMessage("El contenido del artículo es obligatorio.")
    .isString()
    .withMessage("El contenido debe ser una cadena de texto.")
    .isLength({ min: 10 })
    .withMessage("El contenido debe tener al menos 10 caracteres."),
  body("status")
    .optional()
    .isIn(["published", "archived"])
    .withMessage(
      "El estado del artículo no es válido. Debe ser 'published' o 'archived'."
    ),
  body("tags")
    .notEmpty()
    .withMessage("Debes seleccionar una asignatura.")
    .custom(async (tagId) => {
      if (!(await TagModel.findById(tagId))) {
        throw new Error("La asignatura seleccionada no es válida.");
      }
    }),
  body("imageFiles")
    .optional()
    .isArray()
    .withMessage("El campo de imágenes debe ser un arreglo.")
    .custom((files, { req }) => {
      const uploadedFiles = req.files;
      if (uploadedFiles) {
        for (const file of uploadedFiles) {
          if (!file.mimetype.startsWith("image/")) {
            throw new Error("Todos los archivos subidos deben ser imágenes.");
          }
        }
      }
      return true;
    }),
];

export const updateArticleValidation = [
  param("id")
    .notEmpty()
    .withMessage("el id del artículo es obligatorio.")
    .isMongoId()
    .withMessage("el id del artículo no es un ObjectId válido.")
    .custom(async (value) => {
      const article = await ArticleModel.findById(value);
      if (!article) {
        throw new Error("El artículo que intenta actualizar no existe.");
      }
    }),
  body("content")
    .optional()
    .isString()
    .withMessage("El contenido debe ser una cadena de texto.")
    .isLength({ min: 10 })
    .withMessage("El contenido debe tener al menos 10 caracteres."),
  body("status")
    .optional()
    .isIn(["published", "archived"])
    .withMessage(
      "El estado del artículo no es válido. Debe ser 'published' o 'archived'."
    ),
  body("author")
    .optional()
    .isMongoId()
    .withMessage("el id del autor no es un ObjectId válido.")
    .custom(async (value) => {
      const user = await UserModel.findById(value);
      if (!user) {
        throw new Error("El autor referenciado no existe.");
      }
    }),
  body("tags")
    .notEmpty()
    .withMessage("Debes seleccionar una asignatura.")
    .isMongoId()
    .withMessage("La asignatura seleccionada no es válida."),
];

const articleIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("el id del artículo es obligatorio.")
    .isMongoId()
    .withMessage("el id del artículo no es un ObjectId válido.")
    .custom(async (value) => {
      const article = await ArticleModel.findById(value);
      if (!article) {
        throw new Error("El artículo no existe.");
      }
    }),
];

export const getArticleByIdValidation = articleIdValidation;
export const deleteArticleValidation = articleIdValidation;
