import { body, param } from "express-validator";
import { TagModel } from "../../models/tag.model.js";

export const createTagValidation = [
  body("name")
    .notEmpty()
    .withMessage("El nombre del tag es obligatorio.")
    .isString()
    .withMessage("El nombre del tag debe ser una cadena de texto.")
    .isLength({ min: 2, max: 30 })
    .withMessage("El nombre del tag debe tener entre 2 y 30 caracteres.")
    .custom((value) => {
      if (!/^\S+$/.test(value)) {
        throw new Error("El tag no puede contener espacios.");
      }
      return true;
    })
    .custom(async (value) => {
      const tag = await TagModel.findOne({ name: value });
      if (tag) {
        throw new Error("Ya existe un tag con ese nombre.");
      }
    }),
  body("description")
    .optional()
    .isString()
    .withMessage("La descripción debe ser una cadena de texto.")
    .isLength({ min: 4, max: 200 })
    .withMessage(
      "La descripción debe ser minimo de 4 caracteres y no puede exceder los 200."
    ),
];

export const updateTagValidation = [
  param("id")
    .notEmpty()
    .withMessage("El id del tag es obligatorio.")
    .isMongoId()
    .withMessage("El id del tag no es un ObjectId válido.")
    .custom(async (value) => {
      const tag = await TagModel.findById(value);
      if (!tag) {
        throw new Error("El tag que intenta actualizar no existe.");
      }
    }),
  body("name")
    .optional()
    .isString()
    .withMessage("El nombre del tag debe ser una cadena de texto.")
    .isLength({ min: 2, max: 30 })
    .withMessage("El nombre del tag debe tener entre 2 y 30 caracteres.")
    .custom((value) => {
      if (!/^\S+$/.test(value)) {
        throw new Error("El tag no puede contener espacios.");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      const tag = await TagModel.findOne({ name: value });

      if (tag && tag._id.toString() !== req.params.id) {
        throw new Error("Ya existe un tag con ese nombre.");
      }
    }),
  body("description")
    .optional()
    .isString()
    .withMessage("La descripción debe ser una cadena de texto.")
    .isLength({ max: 200 })
    .withMessage("La descripción no puede exceder los 200 caracteres."),
];

const tagIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("El id del tag es obligatorio.")
    .isMongoId()
    .withMessage("El id del tag no es un ObjectId válido.")
    .custom(async (value) => {
      const tag = await TagModel.findById(value);
      if (!tag) {
        throw new Error("El tag no existe.");
      }
    }),
];

export const getTagByIdValidation = tagIdValidation;
export const deleteTagValidation = tagIdValidation;
