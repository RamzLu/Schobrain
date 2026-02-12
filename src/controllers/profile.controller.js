// src/controllers/profile.controller.js
import { UserModel } from "../models/user.model.js";
import { ArticleModel } from "../models/article.model.js";
import { CommentModel } from "../models/comment.model.js";
import { TeacherRequestModel } from "../models/teacherRequest.model.js"; // Importamos el modelo
import path from "path";
import { comparePassword, hashPassword } from "../helpers/bcrypt.helper.js";

// Obtener perfil (actualizado para incluir favoriteComments, teacherStatus y la solicitud docente)
export const getProfile = async (req, res) => {
  try {
    // Incluimos 'favorites', 'favoriteComments' y 'teacherStatus' en el select
    const user = await UserModel.findById(req.userLog.id).select(
      "profile email username role favorites favoriteComments teacherStatus"
    );
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    // BUSCAR LA ÚLTIMA SOLICITUD DOCENTE PARA OBTENER COMENTARIOS DE ADMIN
    const latestRequest = await TeacherRequestModel.findOne({
      user: req.userLog.id,
    }).sort({ createdAt: -1 });

    // Convertimos a objeto para poder agregarle la propiedad teacherRequest
    const responseData = user.toObject();
    responseData.teacherRequest = latestRequest;

    res.json(responseData);
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
      email: user.email,
      username: user.username,
      role: user.role,
      teacherStatus: user.teacherStatus, // Devolver estado docente
      favorites: user.favorites, // Devolver también los favoritos de preguntas
      favoriteComments: user.favoriteComments, // Devolver también los favoritos de respuestas
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

// Función para actualizar Email y Contraseña
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
        return res.status(400).json({
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
        return res.status(400).json({
          message: "La nueva contraseña no cumple los requisitos de seguridad.",
        });
      }

      // Hashear y guardar nueva contraseña
      user.password = await hashPassword(newPassword);
      changesMade = true;
    } else if (currentPassword && !newPassword) {
      // Si mandó la actual pero no la nueva, es un error del usuario
      return res.status(400).json({
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

// FUNCIÓN para eliminar la cuenta
export const deleteAccount = async (req, res) => {
  const userId = req.userLog.id;
  const { password } = req.body; // Recibe la contraseña del body

  // Verifica que se envió la contraseña
  if (!password) {
    return res
      .status(400)
      .json({ message: "Se requiere la contraseña para eliminar la cuenta." });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user || user.deleteAt) {
      // Verifica si ya está soft-deleted
      return res
        .status(404)
        .json({ message: "Usuario no encontrado o ya eliminado" });
    }

    // Verificar la contraseña ingresada
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta." });
    }

    // --- Soft Delete ---
    user.deleteAt = new Date();
    await user.save();

    res.clearCookie("token");
    return res.status(200).json({ message: "Cuenta eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar la cuenta:", error);
    res.status(500).json({ message: "Error interno al eliminar la cuenta." });
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

    const avatarUrl = "/uploads/" + req.file.filename;
    user.profile.avatarUrl = avatarUrl;
    await user.save();

    res.json({ avatarUrl });
  } catch (error) {
    console.error("Error al actualizar avatar:", error);
    res.status(500).json({ message: "Error interno al actualizar avatar" });
  }
};

// === NUEVA FUNCIÓN: Subir/cambiar BANNER ===
export const updateBanner = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No se envió archivo" });
    const user = await UserModel.findById(req.userLog.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const bannerUrl = "/uploads/" + req.file.filename;
    user.profile.bannerUrl = bannerUrl;
    await user.save();

    res.json({ bannerUrl });
  } catch (error) {
    console.error("Error al actualizar banner:", error);
    res.status(500).json({ message: "Error interno al actualizar banner" });
  }
};

// FUNCIÓN para añadir/quitar artículo de favoritos (Preguntas)
export const toggleFavoriteArticle = async (req, res) => {
  const userId = req.userLog.id;
  const { articleId } = req.params;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Verificar si el artículo existe
    const articleExists = await ArticleModel.findById(articleId);
    if (!articleExists) {
      return res.status(404).json({ message: "Artículo no encontrado." });
    }

    const isFavorite = user.favorites.includes(articleId);
    let updatedUser;

    if (isFavorite) {
      // Eliminar de favoritos
      updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $pull: { favorites: articleId } },
        { new: true } // Devuelve el documento actualizado
      ).select("favorites");
      return res.json({
        message: "Artículo eliminado de favoritos.",
        favorites: updatedUser.favorites,
      });
    } else {
      // Añadir a favoritos
      updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $addToSet: { favorites: articleId } }, // addToSet evita duplicados
        { new: true }
      ).select("favorites");
      return res.json({
        message: "Artículo añadido a favoritos.",
        favorites: updatedUser.favorites,
      });
    }
  } catch (error) {
    console.error("Error al gestionar favoritos:", error);
    res.status(500).json({ message: "Error interno al gestionar favoritos." });
  }
};

// FUNCIÓN para obtener los artículos favoritos del usuario
export const getFavoriteArticles = async (req, res) => {
  const userId = req.userLog.id;

  try {
    const user = await UserModel.findById(userId)
      .populate({
        path: "favorites",
        model: "Article",
        populate: [
          // Populamos autor y tags de los artículos favoritos
          { path: "author", select: "username profile role teacherStatus" }, // teacherStatus aquí también es útil
          { path: "tags", select: "name" },
        ],
        // Ordenamos los favoritos por fecha de creación (los más recientes primero)
        options: { sort: { createdAt: -1 } },
      })
      .select("favorites"); // Solo necesitamos el campo 'favorites' populado

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.json(user.favorites); // Devolvemos el array de artículos populados
  } catch (error) {
    console.error("Error al obtener artículos favoritos:", error);
    res
      .status(500)
      .json({ message: "Error interno al obtener artículos favoritos." });
  }
};

// NUEVA FUNCIÓN: Añadir/quitar comentario de favoritos (Respuestas)
export const toggleFavoriteComment = async (req, res) => {
  const userId = req.userLog.id;
  const { commentId } = req.params;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Verificar si el comentario existe
    const commentExists = await CommentModel.findById(commentId);
    if (!commentExists) {
      return res.status(404).json({ message: "Comentario no encontrado." });
    }

    const isFavorite = user.favoriteComments.includes(commentId);
    let updatedUser;

    if (isFavorite) {
      // Eliminar de favoritos
      updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $pull: { favoriteComments: commentId } },
        { new: true }
      ).select("favoriteComments");
      return res.json({
        message: "Respuesta eliminada de favoritos.",
        favoriteComments: updatedUser.favoriteComments,
      });
    } else {
      // Añadir a favoritos
      updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $addToSet: { favoriteComments: commentId } },
        { new: true }
      ).select("favoriteComments");
      return res.json({
        message: "Respuesta añadida a favoritos.",
        favoriteComments: updatedUser.favoriteComments,
      });
    }
  } catch (error) {
    console.error("Error al gestionar comentarios favoritos:", error);
    res
      .status(500)
      .json({ message: "Error interno al gestionar comentarios favoritos." });
  }
};

// NUEVA FUNCIÓN para obtener los comentarios favoritos del usuario
export const getFavoriteComments = async (req, res) => {
  const userId = req.userLog.id;

  try {
    const user = await UserModel.findById(userId)
      .populate({
        path: "favoriteComments",
        model: "Comment",
        populate: [
          // Populamos autor del comentario
          { path: "author", select: "username profile role teacherStatus" },
          // Populamos el artículo al que pertenece. Aseguramos el _id.
          { path: "article", select: "_id content author" }, // <-- VERIFICACIÓN DE SELECCIÓN
        ],
        options: { sort: { createdAt: -1 } },
      })
      .select("favoriteComments");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.json(user.favoriteComments); // Devolvemos el array de comentarios populados
  } catch (error) {
    console.error("Error al obtener comentarios favoritos:", error);
    res
      .status(500)
      .json({ message: "Error interno al obtener comentarios favoritos." });
  }
};
