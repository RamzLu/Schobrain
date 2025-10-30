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
        select: "username profile role",
      },
      {
        path: "article",
        populate: {
          path: "author",
          model: "User",
          select: "username profile role",
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
      .populate("author", "username profile role")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username profile role",
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

// FUNCIÓN PARA VOTAR EN COMENTARIOS
export const voteOnComment = async (req, res) => {
  const { id: commentId } = req.params;
  const { id: userId } = req.userLog;
  const { voteType } = req.body; // 'like' o 'dislike'

  try {
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({ msg: "La respuesta no existe." });
    }

    const hasLiked = comment.votedUp.includes(userId);
    const hasDisliked = comment.votedDown.includes(userId);

    if (voteType === "like") {
      if (hasDisliked)
        await CommentModel.updateOne(
          { _id: commentId },
          { $pull: { votedDown: userId }, $inc: { dislikes: -1 } }
        );
      if (hasLiked) {
        await CommentModel.updateOne(
          { _id: commentId },
          { $pull: { votedUp: userId }, $inc: { likes: -1 } }
        );
      } else {
        await CommentModel.updateOne(
          { _id: commentId },
          { $addToSet: { votedUp: userId }, $inc: { likes: 1 } }
        );
      }
    } else if (voteType === "dislike") {
      if (hasLiked)
        await CommentModel.updateOne(
          { _id: commentId },
          { $pull: { votedUp: userId }, $inc: { likes: -1 } }
        );
      if (hasDisliked) {
        await CommentModel.updateOne(
          { _id: commentId },
          { $pull: { votedDown: userId }, $inc: { dislikes: -1 } }
        );
      } else {
        await CommentModel.updateOne(
          { _id: commentId },
          { $addToSet: { votedDown: userId }, $inc: { dislikes: 1 } }
        );
      }
    } else {
      return res.status(400).json({ msg: "Tipo de voto no válido." });
    }

    const updatedComment = await CommentModel.findById(commentId).select(
      "likes dislikes votedUp votedDown"
    );

    return res.status(200).json({
      msg: "Voto registrado.",
      data: updatedComment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor." });
  }
};
