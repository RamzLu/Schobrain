import { ArticleModel } from "../models/article.model.js";
import { CommentModel } from "../models/comment.model.js";

export const createComment = async (req, res) => {
  const { content, author, article } = req.body;
  try {
    const comment = await CommentModel.create({ content, author, article });
    return res.status(201).json({
      msg: "Comentado publicado correctamente",
      data: comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const getAllComments = async (req, res) => {
  try {
    const comment = await CommentModel.find().populate([
      {
        path: "author",
        select: "-password",
      },
      {
        path: "article",
        populate: {
          path: "author",
          model: "User",
          select: "-password",
        },
      },
    ]);
    return res.status(200).json({
      msg: "Todos los comentarios:",
      data: comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const comment = await CommentModel.findByIdAndUpdate(
      id,
      { content },
      { new: true }
    );
    return res.status(201).json({
      msg: "Commentario editado correctamente",
      data: comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await CommentModel.findByIdAndDelete(id);
    return res.status(200).json({
      msg: "Comentario eliminado correctamente",
      data: comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const getCommentsByArticle = async (req, res) => {
  const { articleId } = req.params;
  try {
    const article = await ArticleModel.findById(articleId)
      .populate("author", "username profile.firstName profile.lastName")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username profile.firstName profile.lastName",
        },
      });
    return res.status(200).json({
      msg: "Comentarios del artículo obtenidos correctamente",
      data: article,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const getUserLogComments = async (req, res) => {
  const user = req.userLog;
  try {
    const comment = await CommentModel.find({ author: user.id });
    return res.status(200).json({
      msg: "Comentarios hechos:",
      data: comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};
