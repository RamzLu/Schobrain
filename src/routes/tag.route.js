import { Router } from "express";
import {
  getTagById,
  getTags,
  updateTag,
} from "../controllers/tag.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import { authAdmin } from "../middlewares/adminMiddleware.js";
import {
  getTagByIdValidation,
  updateTagValidation,
} from "../middlewares/validations/tag.validations.js";
import { validator } from "../middlewares/validator.js";
export const tagRouter = Router();

tagRouter.get("/tags", getTags);
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
