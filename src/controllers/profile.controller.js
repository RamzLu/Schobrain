import { UserModel } from "../models/user.model.js";
import path from "path";
import { comparePassword, hashPassword } from "../helpers/bcrypt.helper.js";

// Obtener perfil (sin cambios)
export const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userLog.id).select(
      "profile email username role"
    );
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ message: "Error interno al obtener perfil" });
  }
};

// Actualizar datos del perfil (nombre, apellido, bio, fecha nac, username)
export const updateProfile = async (req, res) => {
  try {
    const { profile, username } = req.body;
    const userId = req.userLog.id;
    const user = await UserModel.findById(userId);

    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    // Validar username único (si se proporciona y es diferente)
    if (username && username !== user.username) {
      const usernameExists = await UserModel.findOne({ username });
      if (usernameExists)
        return res
          .status(400)
          .json({ message: "El nombre de usuario ya está en uso." });
      user.username = username;
    }

    // Actualiza campos del perfil embebido si existen en req.body.profile
    if (profile && typeof profile === "object") {
      for (const key in profile) {
        if (profile.hasOwnProperty(key) && user.profile.hasOwnProperty(key)) {
          user.profile[key] = profile[key];
        }
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
    console.error("Error al actualizar perfil:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Error de validación", errors: error.errors });
    }
    res.status(500).json({ message: "Error interno al actualizar perfil" });
  }
};

// Actualizar Email y Contraseña (sin cambios respecto a la versión anterior)
export const updateAccount = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const userId = req.userLog.id;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    let changesMade = false;

    // --- Actualizar Contraseña ---
    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({
            message: "Se requiere la contraseña actual para cambiarla.",
          });
      }
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "La contraseña actual es incorrecta." });
      }
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPasswordRegex.test(newPassword)) {
        return res
          .status(400)
          .json({
            message:
              "La nueva contraseña no cumple los requisitos de seguridad.",
          });
      }
      user.password = await hashPassword(newPassword);
      changesMade = true;
    } else if (currentPassword && !newPassword) {
      return res
        .status(400)
        .json({
          message: "Ingresa la nueva contraseña si proporcionaste la actual.",
        });
    }

    // --- Actualizar Email ---
    if (email && email !== user.email) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ message: "El formato del correo electrónico no es válido." });
      }
      const emailExists = await UserModel.findOne({ email });
      if (emailExists && emailExists._id.toString() !== userId) {
        return res
          .status(400)
          .json({ message: "El correo electrónico ya está en uso." });
      }
      user.email = email;
      changesMade = true;
    }

    if (!changesMade) {
      return res
        .status(400)
        .json({ message: "No se proporcionaron cambios para actualizar." });
    }

    await user.save();
    res.json({
      message: "Información de la cuenta actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar cuenta:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Error de validación", errors: error.errors });
    }
    res.status(500).json({ message: "Error interno al actualizar la cuenta." });
  }
};

// NUEVA FUNCIÓN para eliminar la cuenta (Soft Delete)
export const deleteAccount = async (req, res) => {
  const userId = req.userLog.id;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // --- Soft Delete ---
    // Marcar la cuenta como eliminada estableciendo la fecha en deleteAt
    user.deleteAt = new Date();
    await user.save();

    // --- Hard Delete (Alternativa - ¡CUIDADO!) ---
    // Si prefieres eliminar permanentemente el documento:
    // await UserModel.findByIdAndDelete(userId);

    // Limpiar la cookie de sesión
    res.clearCookie("token");

    return res.status(200).json({ message: "Cuenta eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar la cuenta:", error);
    res.status(500).json({ message: "Error interno al eliminar la cuenta." });
  }
};

// Subir/cambiar foto de perfil (sin cambios)
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No se envió archivo" });
    const user = await UserModel.findById(req.userLog.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const avatarUrl = "/uploads/" + req.file.filename;
    user.profile.avatarUrl = avatarUrl;
    await user.save();

    res.json({ avatarUrl });
  } catch (error) {
    console.error("Error al actualizar avatar:", error);
    res.status(500).json({ message: "Error interno al actualizar avatar" });
  }
};
