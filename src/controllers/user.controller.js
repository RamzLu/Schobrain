import { ArticleModel } from "../models/article.model.js";
import { UserModel } from "../models/user.model.js";

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

export const getTopContributors = async (req, res) => {
  try {
    // 1. Obtener la fecha de inicio del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1); // Ir al primer día del mes
    startOfMonth.setHours(0, 0, 0, 0); // Ir al inicio de ese día

    // 2. Usar Aggregation Pipeline
    const topContributors = await ArticleModel.aggregate([
      {
        // 3. Filtrar artículos solo de este mes
        $match: {
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        // 4. Agrupar por autor y sumar sus likes
        $group: {
          _id: "$author", // Agrupar por el ID del autor
          totalLikes: { $sum: "$likes" }, // Sumar los likes de todos sus artículos
        },
      },
      {
        // 5. Ordenar de mayor a menor
        $sort: {
          totalLikes: -1, // -1 para orden descendente
        },
      },
      {
        // 6. Limitar a los 5 mejores
        $limit: 5,
      },
      {
        // 7. Obtener los detalles del usuario (join con la colección 'users')
        $lookup: {
          from: "users", // El nombre de la colección de usuarios en MongoDB
          localField: "_id",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      {
        // 8. Descomprimir el array 'authorDetails' (será un solo objeto)
        $unwind: "$authorDetails",
      },
      {
        // 9. Formatear la salida final (solo datos públicos)
        $project: {
          _id: 0, // Ocultar el _id del grupo
          totalLikes: 1,
          username: "$authorDetails.username",
          profile: "$authorDetails.profile",
          role: "$authorDetails.role",
        },
      },
    ]);

    return res.status(200).json(topContributors);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor al obtener contribuyentes",
    });
  }
};
