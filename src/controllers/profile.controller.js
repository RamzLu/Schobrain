import { UserModel } from "../models/user.model.js";
import path from "path";
import { comparePassword, hashPassword } from "../helpers/bcrypt.helper.js"; // Importa helpers de bcrypt

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
    const { profile, username } = req.body; // Email se maneja en updateAccount
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
        // Actualiza solo si la clave existe en el schema y se envió en el body
        if (profile.hasOwnProperty(key) && user.profile.hasOwnProperty(key)) {
          // Asegura que no se añadan campos extraños
          user.profile[key] = profile[key];
        }
      }
    }

    await user.save();

    // Devuelve los datos actualizados relevantes para la vista de perfil
    res.json({
      profile: user.profile,
      email: user.email, // Mantenemos el email aquí por si acaso, aunque se edite en otra ruta
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    // Devuelve un error más específico si es posible (ej. validación Mongoose)
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Error de validación", errors: error.errors });
    }
    res.status(500).json({ message: "Error interno al actualizar perfil" });
  }
};

// NUEVA FUNCIÓN para actualizar Email y Contraseña
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

      // Verificar contraseña actual
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "La contraseña actual es incorrecta." });
      }

      // Validar fortaleza de la nueva contraseña (podrías usar la misma regex que en el modelo)
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

      // Hashear y guardar nueva contraseña
      user.password = await hashPassword(newPassword);
      changesMade = true;
    } else if (currentPassword && !newPassword) {
      // Si mandó la actual pero no la nueva, es un error del usuario
      return res
        .status(400)
        .json({
          message: "Ingresa la nueva contraseña si proporcionaste la actual.",
        });
    }
    // --- Fin Actualizar Contraseña ---

    // --- Actualizar Email ---
    if (email && email !== user.email) {
      // Validar formato de email (básico)
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ message: "El formato del correo electrónico no es válido." });
      }

      // Validar email único
      const emailExists = await UserModel.findOne({ email });
      // Permitir si el email encontrado pertenece al mismo usuario (aunque no debería pasar si email !== user.email)
      if (emailExists && emailExists._id.toString() !== userId) {
        return res
          .status(400)
          .json({ message: "El correo electrónico ya está en uso." });
      }
      user.email = email;
      changesMade = true;
    }
    // --- Fin Actualizar Email ---

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

// Subir/cambiar foto de perfil (sin cambios)
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
    console.error("Error al actualizar avatar:", error);
    res.status(500).json({ message: "Error interno al actualizar avatar" });
  }
};
