import { Router } from "express";
import {
  createArticle,
  deleteArticle,
  getAllArticles,
  getArticleById,
  getArticlesByTag,
  getUserLogArticles,
  updateArticle,
  voteOnArticle,
  searchArticles,
} from "../controllers/article.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import { ownerOrAdmin } from "../middlewares/ownerOrAdminMiddleware.js";
import { ArticleModel } from "../models/article.model.js";
import { validator } from "../middlewares/validator.js";
import {
  createArticleValidation,
  deleteArticleValidation,
  getArticleByIdValidation,
  updateArticleValidation,
} from "../middlewares/validations/article.validations.js";

import { uploadImages } from "../middlewares/uploadMiddleware.js";

export const routeArticle = Router();

routeArticle.get("/articles/my", validateToken, getUserLogArticles);

// RUTA PARA LA BÚSQUEDA
routeArticle.get("/articles/search", searchArticles);

routeArticle.post(
  "/articles",
  validateToken,
  uploadImages,
  createArticleValidation,
  validator,
  createArticle
);

routeArticle.get("/articles", getAllArticles);

routeArticle.get("/articles/tag/:tagName", getArticlesByTag);

//  RUTA PARA GESTIONAR VOTOS
routeArticle.post("/articles/:id/vote", validateToken, voteOnArticle);

routeArticle.get(
  "/articles/:id",
  validateToken,
  getArticleByIdValidation,
  validator,
  getArticleById
);
routeArticle.put(
  "/articles/:id",
  validateToken,
  ownerOrAdmin(ArticleModel),
  updateArticleValidation,
  validator,
  updateArticle
);
routeArticle.delete(
  "/articles/:id",
  validateToken,
  ownerOrAdmin(ArticleModel),
  deleteArticleValidation,
  validator,
  deleteArticle
);
