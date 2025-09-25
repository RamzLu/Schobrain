import { Router } from "express";
import {
  createTag,
  deleteTag,
  getTagById,
  getTags,
  updateTag,
} from "../controllers/tag.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import { authAdmin } from "../middlewares/adminMiddleware.js";
import {
  createTagValidation,
  deleteTagValidation,
  getTagByIdValidation,
  updateTagValidation,
} from "../middlewares/validations/tag.validations.js";
import { validator } from "../middlewares/validator.js";
export const tagRouter = Router();

tagRouter.post(
  "/tags",
  validateToken,
  authAdmin,
  createTagValidation,
  validator,
  createTag
);
tagRouter.get("/tags", validateToken, getTags);
tagRouter.get(
  "/tags/:id",
  validateToken,
  getTagByIdValidation,
  validator,
  getTagById
);
tagRouter.put(
  "/tags/:id",
  validateToken,
  authAdmin,
  updateTagValidation,
  validator,
  updateTag
);
tagRouter.delete(
  "/tags/:id",
  validateToken,
  authAdmin,
  deleteTagValidation,
  validator,
  deleteTag
);
