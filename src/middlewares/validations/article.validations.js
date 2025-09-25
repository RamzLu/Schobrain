import { ArticleModel } from "../../models/article.model.js";
import { TagModel } from "../../models/tag.model.js";
import { UserModel } from "../../models/user.model.js";

import { body, param } from "express-validator";

export const createArticleValidation = [
  body("title")
    .notEmpty()
    .withMessage("El título del artículo es obligatorio.")
    .isString()
    .withMessage("El título debe ser una cadena de texto.")
    .isLength({ min: 3, max: 200 })
    .withMessage("El título debe tener entre 3 y 200 caracteres."),
  body("content")
    .notEmpty()
    .withMessage("El contenido del artículo es obligatorio.")
    .isString()
    .withMessage("El contenido debe ser una cadena de texto.")
    .isLength({ min: 10 })
    .withMessage("El contenido debe tener al menos 10 caracteres."),
  body("excerpt")
    .optional()
    .isString()
    .withMessage("El extracto debe ser una cadena de texto.")
    .isLength({ min: 10 })
    .withMessage("El extracto debe tener al menos 10 caracteres."),
  body("status")
    .optional()
    .isIn(["published", "archived"])
    .withMessage(
      "El estado del artículo no es válido. Debe ser 'published' o 'archived'."
    ),
  body("author")
    .notEmpty()
    .withMessage("el id del autor es obligatorio.")
    .isMongoId()
    .withMessage("el id del autor no es un ObjectId válido.")
    .custom(async (value) => {
      const user = await UserModel.findById(value);
      if (!user) {
        throw new Error("El autor referenciado no existe.");
      }
    }),
  body("tags")
    .optional()
    .isArray()
    .withMessage("Los tags deben ser un array.")
    .custom(async (tagIds) => {
      // si el array de tags esta vacio, se permite
      if (tagIds.length === 0) {
        return true;
      }

      const existingTags = await TagModel.find({ _id: { $in: tagIds } });
      if (existingTags.length !== tagIds.length) {
        throw new Error("Al menos uno de los tags referenciados no existe.");
      }
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
  body("title")
    .optional()
    .isString()
    .withMessage("El título debe ser una cadena de texto.")
    .isLength({ min: 3, max: 200 })
    .withMessage("El título debe tener entre 3 y 200 caracteres."),
  body("content")
    .optional()
    .isString()
    .withMessage("El contenido debe ser una cadena de texto.")
    .isLength({ min: 10 })
    .withMessage("El contenido debe tener al menos 10 caracteres."),
  body("excerpt")
    .optional()
    .isString()
    .withMessage("El extracto debe ser una cadena de texto.")
    .isLength({ min: 10 })
    .withMessage("El extracto debe tener al menos 10 caracteres."),
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
    .optional()
    .isArray()
    .withMessage("Los tags deben ser un array.")
    .custom(async (tagIds) => {
      if (tagIds.length === 0) {
        return true;
      }
      const existingTags = await TagModel.find({ _id: { $in: tagIds } });
      if (existingTags.length !== tagIds.length) {
        throw new Error("Al menos uno de los tags referenciados no existe.");
      }
    }),
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
