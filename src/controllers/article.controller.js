import { ArticleModel } from "../models/article.model.js";

export const createArticle = async (req, res) => {
  const authorId = req.userLog.id;
  const { content, status, author, tags } = req.body;
  try {
    console.log(req.body);
    const article = await ArticleModel.create({
      content,
      status,
      author: authorId, // al hacer una pregunta le asignamos el author automaticamente
      tags,
    });
    return res.status(201).json({
      msg: "Articulo creado correctamente",
      data: article,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const getAllArticles = async (req, res) => {
  try {
    const article = await ArticleModel.find().populate([
      {
        path: "comments",
        populate: {
          path: "author",
          model: "User",
          select: "-password",
        },
      },
    ]);
    return res.status(200).json(article);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const getArticleById = async (req, res) => {
  const { id } = req.params;
  try {
    const article = await ArticleModel.findById(id).populate([
      {
        path: "comments",
        populate: {
          path: "author",
          model: "User",
          select: "-password",
        },
      },
    ]);
    return res.status(200).json(article);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const deleteArticle = async (req, res) => {
  const { id } = req.params;
  try {
    const article = await ArticleModel.findOneAndDelete(id);
    return res.status(200).json({
      msg: "Articulo eliminado",
      data: article,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const updateArticle = async (req, res) => {
  const { id } = req.params;
  const { content, status, tags } = req.body;
  try {
    const article = await ArticleModel.findByIdAndUpdate(
      id,
      {
        content,
        status,
        tags,
      },
      { new: true }
    ).populate([
      {
        path: "comments",
        populate: {
          path: "author",
          model: "User",
          select: "-password",
        },
      },
    ]);
    return res.status(201).json({
      msg: "Articulo actualizado correctamente",
      data: article,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const getUserLogArticles = async (req, res) => {
  const user = req.userLog;
  try {
    console.log(user);
    const article = await ArticleModel.find({ author: user.id });
    return res.status(200).json({
      msg: "Tus articulos:",
      data: article,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};
