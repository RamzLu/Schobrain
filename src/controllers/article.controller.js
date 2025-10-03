import { ArticleModel } from "../models/article.model.js";

export const createArticle = async (req, res) => {
  const authorId = req.userLog.id;
  const { content, status, tags } = req.body; // Solo toma los campos que se esperan

  //  Obtener la URL de la imagen si se subió
  let imageUrl = null;
  if (req.file) {
    // La URL es la ruta relativa a la carpeta 'public'
    imageUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const article = await ArticleModel.create({
      content,
      // status y tags se establecen si se envían, o toman el valor por defecto del esquema (ej. status: 'published')
      status,
      author: authorId, // Asignamos el autor logeado automáticamente
      tags,
      imageUrl, // Guardar la URL de la imagen
    });

    // Poblamos los datos del autor (nombre y perfil)
    const populatedArticle = await ArticleModel.findById(article._id)
      .populate(
        "author",
        "-password" // Trae todos los campos del usuario excepto la contraseña
      )
      .populate("tags", "name"); // poblamos solo el nombre del tag

    return res.status(201).json({
      msg: "Articulo creado correctamente",
      data: populatedArticle, // Devolvemos el artículo con el autor poblado
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
    const article = await ArticleModel.find()
      .populate("author", "-password")
      .populate("tags", "name")
      // Se añade 'imageUrl' a la selección para que se envíe al frontend
      .select("content author createdAt tags imageUrl")
      .sort({ createdAt: -1 });
    return res.status(200).json(article);
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
    const article = await ArticleModel.findById(id).populate([
      {
        path: "comments",
        populate: {
          path: "author",
          model: "User",
          select: "-password",
        },
      },
    ]);
    return res.status(200).json(article);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const deleteArticle = async (req, res) => {
  const { id } = req.params;
  try {
    const article = await ArticleModel.findOneAndDelete(id);
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
  const { content, status, tags } = req.body;
  try {
    const article = await ArticleModel.findByIdAndUpdate(
      id,
      {
        content,
        status,
        tags,
      },
      { new: true }
    ).populate([
      {
        path: "comments",
        populate: {
          path: "author",
          model: "User",
          select: "-password",
        },
      },
    ]);
    return res.status(201).json({
      msg: "Articulo actualizado correctamente",
      data: article,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor",
    });
  }
};

export const getUserLogArticles = async (req, res) => {
  const user = req.userLog;
  try {
    console.log(user);
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
