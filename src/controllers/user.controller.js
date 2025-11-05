import { populate } from "dotenv";
import { UserModel } from "../models/user.model.js";
import { ArticleModel } from "../models/article.model.js";
import { CommentModel } from "../models/comment.model.js";

export const deleteUser = async (req, res) => {
  const { _id } = req.params.id;
  try {
    const deleteUser = await UserModel.findOneAndUpdate(
      _id,
      { deleteAt: new Date() },
      { new: true }
    );
    return res.status(200).json({
      msg: "Usuario eliminado correctamente",
      data: deleteUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // select porque el campo ya esta en mi schema
    const user = await UserModel.find().select("-password");
    return res.status(200).json({
      msg: "Lista de usuarios:",
      data: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

// Nueva función para el perfil público
export const getPublicUserProfileById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id)
      .select("username profile role") // Solo seleccionamos campos públicos
      .populate({
        path: "articles", // Populamos sus preguntas
        model: "Article",
        options: { sort: { createdAt: -1 } }, // Ordenamos
        // === INICIO DE LA MODIFICACIÓN (Bug 2) ===
        select:
          "content author createdAt tags imageUrls likes dislikes votedUp votedDown", // <-- Añadido 'author'
        populate: [
          { path: "tags", model: "Tag", select: "name" },
          { path: "author", model: "User", select: "username profile role" }, // <-- Populamos el autor de la pregunta
        ],
        // === FIN DE LA MODIFICACIÓN ===
      })
      .populate({
        path: "comments", // Populamos sus respuestas
        model: "Comment",
        options: { sort: { createdAt: -1 } },
        // === INICIO DE LA MODIFICACIÓN (Bug 2) ===
        select: "content author createdAt article imageUrls", // <-- Añadido 'author'
        populate: [
          { path: "article", model: "Article", select: "content" },
          { path: "author", model: "User", select: "username profile role" }, // <-- Populamos el autor de la respuesta
        ],
        // === FIN DE LA MODIFICACIÓN ===
      });

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id)
      .populate({
        path: "articles",
        populate: [
          {
            path: "author",
            model: "User",
            select: "username email profile role",
          },
          {
            path: "comments",
            model: "Comment",
            populate: {
              path: "author",
              model: "User",
              select: "username email profile role",
            },
          },
        ],
      })
      .select("-password");
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const updateUser = async (req, res) => {
  const data = req.body;
  const { id } = req.params;
  try {
    const user = await UserModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    return res.status(200).json({
      msg: "Usuario actualizado correctamente",
      data: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};
