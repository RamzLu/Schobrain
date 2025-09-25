import { populate } from "dotenv";
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

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id)
      .populate({
        path: "articles",
        populate: {
          path: "author",
          model: "User",
          select: "username email profile",
        },
        populate: {
          path: "comments",
          model: "Comment",
          populate: {
            path: "author",
            model: "User",
            select: "username email profile",
          },
        },
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
