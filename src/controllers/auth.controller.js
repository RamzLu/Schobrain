import e from "express";
import { comparePassword, hashPassword } from "../helpers/bcrypt.helper.js";
import { generateToken } from "../helpers/jwt.helper.js";
import { UserModel } from "../models/user.model.js";

export const register = async (req, res) => {
  const { username, email, password, role, profile } = req.body;
  try {
    const hashedPassword = await hashPassword(password);

    await UserModel.create({
      username: username,
      email: email,
      password: hashedPassword,
      role: role,
      profile: profile,
    });

    return res.status(201).json({
      msg: "Registrado correctamente",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Error interno del servidor",
    });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // en mongoDB ya no se utiliza where
    const user = await UserModel.findOne({
      username: username,
    });
    console.log(user);
    if (!user) {
      return res.status(404).json({
        msg: "El usuario o la contraseña no coinciden",
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(404).json({
        msg: "El usuario o la contraseña no coinciden",
      });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    });

    return res.status(200).json({
      msg: `Logeado correctamente, ¡Hola ${user.profile.firstName}!`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Error interno del servidor",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const user = req.userLog;
    res.clearCookie("token"); // Eliminar cookie del navegador
    return res.json({
      msg: `Logout exitoso, adiós ${user.firstName}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Error interno del servidor",
    });
  }
};

export const profile = async (req, res) => {
  const user = req.userLog;
  try {
    return res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      biography: user.biography,
      avatarUrl: user.avatarUrl,
      birthDate: user.birthDate,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor.",
    });
  }
};

export const updateProfile = async (req, res) => {
  const user = req.userLog;
  const { profile } = req.body;

  try {
    const userDatabase = await UserModel.findById(user.id);

    const updatedProfile = { ...userDatabase.profile, ...profile };

    await UserModel.updateOne(
      { _id: user.id },
      { $set: { profile: updatedProfile } }
    );

    return res.status(200).json({
      msg: "Perfil actualizado correctamente",
      data: updatedProfile,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const verifyToken = (req, res) => {
  // Si el middleware validateToken pasa, significa que el token es válido.
  // Devolvemos los datos del usuario por si el frontend los necesita.
  return res.status(200).json({
    msg: "Token válido.",
    data: req.userLog,
  });
};
