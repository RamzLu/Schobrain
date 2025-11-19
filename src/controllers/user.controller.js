import { UserModel } from "../models/user.model.js";
import { ArticleModel } from "../models/article.model.js";

// ... (Otras funciones: deleteUser, getAllUsers, etc. se mantienen igual)

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteUser = await UserModel.findByIdAndUpdate(
      id,
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

export const getPublicUserProfileById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id)
      .select("username profile role teacherStatus")
      .populate({
        path: "articles",
        model: "Article",
        options: { sort: { createdAt: -1 } },
        select:
          "content author createdAt tags imageUrls likes dislikes votedUp votedDown",
        populate: [
          { path: "tags", model: "Tag", select: "name" },
          {
            path: "author",
            model: "User",
            select: "username profile role teacherStatus",
          },
        ],
      })
      .populate({
        path: "comments",
        model: "Comment",
        options: { sort: { createdAt: -1 } },
        select: "content author createdAt article imageUrls",
        populate: [
          { path: "article", model: "Article", select: "content" },
          {
            path: "author",
            model: "User",
            select: "username profile role teacherStatus",
          },
        ],
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

// === LÓGICA DEL PODIO + TOP 10 ===
export const getTopContributors = async (req, res) => {
  try {
    const topUsers = await ArticleModel.aggregate([
      // 1. Agrupar por autor y sumar likes
      {
        $group: {
          _id: "$author",
          totalLikes: { $sum: "$likes" },
        },
      },
      // 2. Ordenar por likes descendente
      { $sort: { totalLikes: -1 } },
      // 3. Limitar a top 10 (3 Podio + 7 Lista)
      { $limit: 10 },
      // 4. Obtener datos del usuario
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      // 5. Desestructurar el array de usuario
      { $unwind: "$user" },
      // 6. Proyectar solo los campos necesarios
      {
        $project: {
          _id: "$user._id",
          username: "$user.username",
          firstName: "$user.profile.firstName",
          lastName: "$user.profile.lastName",
          avatarUrl: "$user.profile.avatarUrl",
          role: "$user.role",
          totalLikes: 1,
        },
      },
    ]);

    return res.status(200).json(topUsers);
  } catch (error) {
    console.error("Error en getTopContributors:", error);
    return res.status(500).json({
      msg: "Error interno al obtener contribuyentes",
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
            select: "username email profile role teacherStatus",
          },
          {
            path: "comments",
            model: "Comment",
            populate: {
              path: "author",
              model: "User",
              select: "username email profile role teacherStatus",
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
