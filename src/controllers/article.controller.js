import { ArticleModel } from "../models/article.model.js";
import { TagModel } from "../models/tag.model.js";

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

export const getArticleById = async (req, res) => {
  const { id } = req.params;
  try {
    const article = await ArticleModel.findById(id)
      .populate("author", "-password")
      .populate({
        path: "comments",
        // Ordenamos por likes (desc) y luego por fecha (desc)
        options: { sort: { likes: -1, createdAt: -1 } },
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

//FUNCIÓN PARA LA BÚSQUEDA
export const searchArticles = async (req, res) => {
  const { query } = req.query; // Obtenemos el término de búsqueda de la URL (ej: /search?query=matrices)

  if (!query) {
    return res
      .status(400)
      .json({ msg: "Debes proporcionar un término de búsqueda." });
  }

  try {
    const articles = await ArticleModel.find({
      // Usamos una expresión regular para buscar el texto en el contenido
      // 'i' hace que la búsqueda no distinga mayúsculas/minúsculas
      content: { $regex: query, $options: "i" },
    })
      .populate("author", "-password")
      .populate("tags", "name")
      .select(
        "content author createdAt tags imageUrls likes dislikes votedUp votedDown"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(articles);
  } catch (error) {
    console.log(error);
    return res.status(501).json({ msg: "Error interno del servidor." });
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
  const { content, tags, imagesToDelete } = req.body;

  try {
    const article = await ArticleModel.findById(id);
    if (!article) {
      return res.status(404).json({ message: "Artículo no encontrado" });
    }

    let updatedImageUrls = article.imageUrls || [];

    // Eliminar imágenes marcadas
    if (imagesToDelete) {
      const toDelete = Array.isArray(imagesToDelete)
        ? imagesToDelete
        : [imagesToDelete];
      updatedImageUrls = updatedImageUrls.filter(
        (url) => !toDelete.includes(url)
      );
    }

    // Añadir nuevas imágenes
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map((file) => `/uploads/${file.filename}`);
      updatedImageUrls.push(...newImageUrls);
    }

    const updatedArticle = await ArticleModel.findByIdAndUpdate(
      id,
      {
        content,
        tags: Array.isArray(tags) ? tags : [tags],
        imageUrls: updatedImageUrls,
      },
      { new: true }
    )
      .populate("author", "-password")
      .populate("tags", "name");

    return res.status(200).json({
      message: "Artículo actualizado correctamente",
      data: updatedArticle,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error interno del servidor",
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
