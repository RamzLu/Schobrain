import { Router } from "express";
import {
  createComment,
  deleteComment,
  getAllComments,
  getCommentsByArticle,
  getUserLogComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import { ownerOrAdmin } from "../middlewares/ownerOrAdminMiddleware.js";
import {
  createCommentValidation,
  deleteCommentValidation,
  getCommentsByArticleValidation,
  updateCommentValidation,
} from "../middlewares/validations/comment.validations.js";
import { validator } from "../middlewares/validator.js";
export const routeComment = Router();

routeComment.get("/comments/my", validateToken, getUserLogComments);
routeComment.post(
  "/comments",
  validateToken,
  createCommentValidation,
  validator,
  createComment
);
routeComment.get("/comments", validateToken, getAllComments);
routeComment.put(
  "/comments/:id",
  validateToken,
  ownerOrAdmin,
  updateCommentValidation,
  validator,
  updateComment
);
routeComment.delete(
  "/comments/:id",
  validateToken,
  ownerOrAdmin,
  deleteCommentValidation,
  validator,
  deleteComment
);

routeComment.get(
  "/comments/article/:articleId",
  validateToken,
  getCommentsByArticleValidation,
  validator,
  getCommentsByArticle
);
