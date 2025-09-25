import { body, param } from "express-validator";
import { UserModel } from "../../models/user.model.js";

export const createUserValidation = [
  body("username")
    .notEmpty()
    .withMessage("El nombre de usuario es obligatorio.")
    .isString()
    .withMessage("El nombre de usuario debe ser una cadena de texto.")
    .isLength({ min: 3, max: 20 })
    .withMessage("El nombre de usuario debe tener entre 3 y 20 caracteres.")
    .trim()
    .custom(async (value) => {
      const user = await UserModel.findOne({ username: value });
      if (user) {
        throw new Error("El nombre de usuario ya está en uso.");
      }
    }),
  body("email")
    .notEmpty()
    .withMessage("El correo electrónico es obligatorio.")
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value) => {
      const user = await UserModel.findOne({ email: value });
      if (user) {
        throw new Error("El correo electrónico ya está registrado.");
      }
    }),
  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria.")
    .isStrongPassword()
    .withMessage(
      "La contraseña debe tener mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos."
    ),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage(
      "El rol especificado no es válido. Debe ser 'user' o 'admin'."
    ),
  body("profile.firstName")
    .notEmpty()
    .withMessage("El nombre del perfil es obligatorio.")
    .isString()
    .withMessage("El nombre debe ser una cadena de texto.")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres."),
  body("profile.lastName")
    .notEmpty()
    .withMessage("El apellido del perfil es obligatorio.")
    .isString()
    .withMessage("El apellido debe ser una cadena de texto.")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres."),
  body("profile.biography")
    .optional()
    .isString()
    .withMessage("La biografía debe ser una cadena de texto.")
    .isLength({ max: 500 })
    .withMessage("La biografía no puede exceder los 500 caracteres."),
  body("profile.avatarUrl")
    .optional()
    .isURL()
    .withMessage("La URL del avatar no es válida."),
  body("profile.birthDate")
    .optional()
    .isDate()
    .withMessage("La fecha de nacimiento no es válida."),
];

export const updateUserValidation = [
  param("id")
    .notEmpty()
    .withMessage("El id del tag es obligatorio.")
    .isMongoId()
    .withMessage("El id del tag no es un ObjectId válido.")
    .custom(async (value) => {
      const tag = await UserModel.findById(value);
      if (!tag) {
        throw new Error("El user no existe.");
      }
    }),
  body("username")
    .optional()
    .isString()
    .withMessage("El nombre de usuario debe ser una cadena de texto.")
    .isLength({ min: 3, max: 20 })
    .withMessage("El nombre de usuario debe tener entre 3 y 20 caracteres.")
    .trim()
    .custom(async (value, { req }) => {
      const user = await UserModel.findOne({ where: { username: value } });
      if (user && user.id !== parseInt(req.params.id)) {
        throw new Error(
          "El nombre de usuario ya está en uso por otro usuario."
        );
      }
      return true;
    }),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Debe proporcionar un correo electrónico válido.")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const user = await UserModel.findOne({ email: value });
      if (user && user._id.toString() !== req.params.id) {
        throw new Error(
          "El correo electrónico ya está en uso por otro usuario."
        );
      }
    }),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres.")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    .withMessage(
      "La nueva contraseña debe tener mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos."
    ),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("El rol especificado no es válido."),
  body("profile.firstName")
    .optional()
    .isString()
    .withMessage("El nombre debe ser una cadena de texto.")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres."),
  body("profile.lastName")
    .optional()
    .isString()
    .withMessage("El apellido debe ser una cadena de texto.")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres."),
  body("profile.biography")
    .optional()
    .isString()
    .withMessage("La biografía debe ser una cadena de texto.")
    .isLength({ max: 500 })
    .withMessage("La biografía no puede exceder los 500 caracteres."),
  body("profile.avatarUrl")
    .optional()
    .isURL()
    .withMessage("La URL del avatar no es válida."),
  body("profile.birthDate")
    .optional()
    .isDate()
    .withMessage("La fecha de nacimiento no es válida."),
];

export const updateOnlyProfile = [
  body("profile.firstName")
    .optional()
    .notEmpty()
    .withMessage("El nombre del perfil es obligatorio.")
    .isString()
    .withMessage("El nombre debe ser una cadena de texto.")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres."),
  body("profile.lastName")
    .optional()
    .notEmpty()
    .withMessage("El apellido del perfil es obligatorio.")
    .isString()
    .withMessage("El apellido debe ser una cadena de texto.")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres."),
  body("profile.biography")
    .optional()
    .isString()
    .withMessage("La biografía debe ser una cadena de texto.")
    .isLength({ max: 500 })
    .withMessage("La biografía no puede exceder los 500 caracteres."),
  body("profile.avatarUrl")
    .optional()
    .isURL()
    .withMessage("La URL del avatar no es válida."),
  body("profile.birthDate")
    .optional()
    .isDate()
    .withMessage("La fecha de nacimiento no es válida."),
];

const userIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("El id del tag es obligatorio.")
    .isMongoId()
    .withMessage("El id del tag no es un ObjectId válido.")
    .custom(async (value) => {
      const tag = await UserModel.findById(value);
      if (!tag) {
        throw new Error("El user no existe.");
      }
    }),
];

export const getUserByIdValidation = userIdValidation;
export const deleteUserValidation = userIdValidation;
