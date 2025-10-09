import { UserModel } from "../models/user.model.js";
import path from "path";

export const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userLog.id).select(
      "profile email username role"
    );
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener perfil" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body); // <-- Agrega esto
    const { profile, email, username } = req.body;
    const user = await UserModel.findById(req.userLog.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    // Validar email único
    if (email && email !== user.email) {
      const emailExists = await UserModel.findOne({ email });
      if (emailExists)
        return res.status(400).json({ message: "El correo ya está en uso." });
      user.email = email;
    }

    // Validar username único
    if (username && username !== user.username) {
      const usernameExists = await UserModel.findOne({ username });
      if (usernameExists)
        return res
          .status(400)
          .json({ message: "El nombre de usuario ya está en uso." });
      user.username = username;
    }

    // Actualiza campos del perfil embebido
    for (const key in profile) {
      if (profile.hasOwnProperty(key)) {
        user.profile[key] = profile[key];
      }
    }

    await user.save();
    res.json({
      profile: user.profile,
      email: user.email,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
};

// Subir/cambiar foto de perfil
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No se envió archivo" });
    const user = await UserModel.findById(req.userLog.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    // Guarda la ruta pública de la imagen
    const avatarUrl = "/uploads/" + req.file.filename;
    user.profile.avatarUrl = avatarUrl;
    await user.save();

    res.json({ avatarUrl });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar avatar" });
  }
};
