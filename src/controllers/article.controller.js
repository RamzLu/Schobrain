import { ArticleModel } from "../models/article.model.js";
import { TagModel } from "../models/tag.model.js";

// ... (createArticle se mantiene igual)
export const createArticle = async (req, res) => {
  const authorId = req.userLog.id;
  const { content, status, tags } = req.body;

  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    console.log(
      "Archivos recibidos:",
      req.files.map((f) => f.originalname)
    );
    imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
  }

  try {
    const article = await ArticleModel.create({
      content,
      status,
      author: authorId,
      tags,
      imageUrls,
    });

    const populatedArticle = await ArticleModel.findById(article._id)
      .populate("author", "-password")
      .populate("tags", "name");

    return res.status(201).json({
      msg: "Articulo creado correctamente",
      data: populatedArticle,
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
    const articles = await ArticleModel.find()
      .populate("author", "-password")
      .populate("tags", "name")
      // ✅ Se añaden los campos de votación a la selección
      .select(
        "content author createdAt tags imageUrls likes dislikes votedUp votedDown"
      )
      .sort({ createdAt: -1 });
    return res.status(200).json(articles);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

// ... (getArticleById, deleteArticle, etc., se mantienen igual)
export const getArticleById = async (req, res) => {
  const { id } = req.params;
  try {
    const article = await ArticleModel.findById(id)
      .populate("author", "-password")
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "author",
          model: "User",
          select: "-password",
        },
      });

    if (!article) {
      return res.status(404).json({ msg: "Pregunta no encontrada." });
    }

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
    const article = await ArticleModel.findOneAndDelete({ _id: id });
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

export const getArticlesByTag = async (req, res) => {
  const { tagName } = req.params;
  try {
    const tag = await TagModel.findOne({ name: tagName });
    if (!tag) {
      return res.status(404).json({ msg: "Asignatura no encontrada" });
    }

    const articles = await ArticleModel.find({ tags: tag._id })
      .populate("author", "-password")
      .populate("tags", "name")
      .select(
        "content author createdAt tags imageUrls likes dislikes votedUp votedDown"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(articles);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

//FUNCIÓN PARA MANEJAR LA LÓGICA DE VOTACIÓN
export const voteOnArticle = async (req, res) => {
  const { id: articleId } = req.params;
  const { id: userId } = req.userLog;
  const { voteType } = req.body; // 'like' o 'dislike'

  try {
    const article = await ArticleModel.findById(articleId);
    if (!article) {
      return res.status(404).json({ msg: "La pregunta no existe." });
    }

    const hasLiked = article.votedUp.includes(userId);
    const hasDisliked = article.votedDown.includes(userId);

    if (voteType === "like") {
      // Quitar dislike si lo tenía
      if (hasDisliked) {
        await ArticleModel.updateOne(
          { _id: articleId },
          { $pull: { votedDown: userId }, $inc: { dislikes: -1 } }
        );
      }
      // Añadir o quitar like
      if (hasLiked) {
        await ArticleModel.updateOne(
          { _id: articleId },
          { $pull: { votedUp: userId }, $inc: { likes: -1 } }
        );
      } else {
        await ArticleModel.updateOne(
          { _id: articleId },
          { $addToSet: { votedUp: userId }, $inc: { likes: 1 } }
        );
      }
    } else if (voteType === "dislike") {
      // Quitar like si lo tenía
      if (hasLiked) {
        await ArticleModel.updateOne(
          { _id: articleId },
          { $pull: { votedUp: userId }, $inc: { likes: -1 } }
        );
      }
      // Añadir o quitar dislike
      if (hasDisliked) {
        await ArticleModel.updateOne(
          { _id: articleId },
          { $pull: { votedDown: userId }, $inc: { dislikes: -1 } }
        );
      } else {
        await ArticleModel.updateOne(
          { _id: articleId },
          { $addToSet: { votedDown: userId }, $inc: { dislikes: 1 } }
        );
      }
    } else {
      return res.status(400).json({ msg: "Tipo de voto no válido." });
    }

    const updatedArticle = await ArticleModel.findById(articleId).select(
      "likes dislikes votedUp votedDown"
    );

    return res.status(200).json({
      msg: "Voto registrado.",
      data: updatedArticle,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno del servidor." });
  }
};
