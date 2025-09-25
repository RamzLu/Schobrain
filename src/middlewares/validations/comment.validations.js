import { body, param } from "express-validator";
import { ArticleModel } from "../../models/article.model.js";
import { UserModel } from "../../models/user.model.js";
import { CommentModel } from "../../models/comment.model.js";

export const createCommentValidation = [
  body("content")
    .notEmpty()
    .withMessage("El contenido del comentario es obligatorio.")
    .isString()
    .withMessage("El contenido debe ser una cadena de texto.")
    .isLength({ min: 5, max: 500 })
    .withMessage("El contenido debe tener entre 5 y 500 caracteres."),
  body("author")
    .notEmpty()
    .withMessage("El id del autor es obligatorio.")
    .isMongoId()
    .withMessage("El id del autor no es un ObjectId válido.")
    .custom(async (value) => {
      const user = await UserModel.findById(value);
      if (!user) {
        throw new Error("El autor referenciado no existe.");
      }
    }),
  body("article")
    .notEmpty()
    .withMessage("El id del artículo es obligatorio.")
    .isMongoId()
    .withMessage("El id del artículo no es un ObjectId válido.")
    .custom(async (value) => {
      const article = await ArticleModel.findById(value);
      if (!article) {
        throw new Error("El articulo referenciado no existe.");
      }
    }),
];

export const updateCommentValidation = [
  param("id")
    .notEmpty()
    .withMessage("el id del comentario es obligatorio.")
    .isMongoId()
    .withMessage("el id del comentario no es un ObjectId válido.")
    .custom(async (value) => {
      const comment = await CommentModel.findById(value);
      if (!comment) {
        throw new Error("El comentario que intenta actualizar no existe.");
      }
    }),
  body("content")
    .optional()
    .isString()
    .withMessage("El contenido debe ser una cadena de texto.")
    .isLength({ min: 5, max: 500 })
    .withMessage("El contenido debe tener entre 5 y 500 caracteres."),
  body("author")
    .optional()
    .isMongoId()
    .withMessage("El id del autor no es un ObjectId válido.")
    .custom(async (value) => {
      const user = await UserModel.findById(value);
      if (!user) {
        throw new Error("El autor referenciado no existe.");
      }
    }),
  body("article")
    .optional()
    .isMongoId()
    .withMessage("El id del artículo no es un ObjectId válido.")
    .custom(async (value) => {
      const article = await ArticleModel.findById(value);
      if (!article) {
        throw new Error("El articulo referenciado no existe.");
      }
    }),
];

export const deleteCommentValidation = [
  param("id")
    .notEmpty()
    .withMessage("el id del comentario es obligatorio.")
    .isMongoId()
    .withMessage("el id del comentario no es un ObjectId válido.")
    .custom(async (value) => {
      const comment = await CommentModel.findById(value);
      if (!comment) {
        throw new Error("El comentario no existe.");
      }
    }),
];

export const getCommentsByArticleValidation = [
  param("articleId")
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
