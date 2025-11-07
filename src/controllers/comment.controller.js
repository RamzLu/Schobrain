import { ArticleModel } from "../models/article.model.js";
import { CommentModel } from "../models/comment.model.js";
import mongoose from "mongoose"; // Importar mongoose

export const createComment = async (req, res) => {
  // === INICIO DE LA MODIFICACIÓN (Añadir parentComment) ===
  const { content, author, article, parentComment } = req.body;

  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
  }

  try {
    // === CORRECCIÓN CRÍTICA ===
    // Preparamos el objeto del comentario
    const commentData = {
      content,
      author,
      article,
      imageUrls,
    };

    // Verificamos si parentComment es un ID de Mongo válido
    // FormData puede enviar 'null' o 'undefined' como strings
    if (parentComment && mongoose.Types.ObjectId.isValid(parentComment)) {
      commentData.parentComment = parentComment;
    } else {
      commentData.parentComment = null; // Aseguramos que sea null si no es válido
    }
    // === FIN DE LA CORRECCIÓN ===

    const comment = await CommentModel.create(commentData);

    // Populamos el comentario recién creado para devolverlo
    const populatedComment = await CommentModel.findById(comment._id).populate(
      "author",
      "username profile role"
    );

    return res.status(201).json({
      msg: "Comentado publicado correctamente",
      data: populatedComment,
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
    const comment = await CommentModel.findById(id);
    if (!comment) {
      return res.status(404).json({ msg: "Comentario no encontrado." });
    }

    // Función recursiva para eliminar todas las respuestas anidadas
    const deleteReplies = async (commentId) => {
      const replies = await CommentModel.find({ parentComment: commentId });
      for (const reply of replies) {
        await deleteReplies(reply._id); // Llama recursivamente
        await CommentModel.findByIdAndDelete(reply._id);
      }
    };

    // Iniciar el borrado en cascada
    await deleteReplies(id);

    // Borrar el comentario principal
    await CommentModel.findByIdAndDelete(id);

    return res.status(200).json({
      msg: "Comentario y respuestas eliminados correctamente",
      data: comment, // Devuelve el comentario que se eliminó
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

// Esta función ya no es utilizada por getArticleById, pero la mantenemos
export const getCommentsByArticle = async (req, res) => {
  const { articleId } = req.params;
  try {
    const comments = await CommentModel.find({
      article: articleId,
      parentComment: null, // Solo comentarios de nivel superior
    })
      .populate("author", "username profile role")
      .populate({
        path: "replies", // Pobla las respuestas (Nivel 2)
        populate: {
          // Pobla el autor de esas respuestas
          path: "author",
          select: "username profile role",
        },
      })
      .sort({ likes: -1, createdAt: -1 }); // Ordenar por likes/fecha

    return res.status(200).json({
      msg: "Comentarios del artículo obtenidos correctamente",
      data: comments, // Devolvemos solo los comentarios
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
