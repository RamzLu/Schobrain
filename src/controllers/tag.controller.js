import { TagModel } from "../models/tag.model.js";

export const createTag = async (req, res) => {
  const { name, description } = req.body;
  try {
    console.log(req.body);
    const tag = await TagModel.create({ name, description });
    return res.status(201).json({
      msg: "Tag creada correctamente",
      data: tag,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor.",
    });
  }
};

export const getTags = async (req, res) => {
  try {
    const tags = await TagModel.find();
    return res.status(200).json(tags);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor.",
    });
  }
};

export const deleteTag = async (req, res) => {
  const { id } = req.params;
  try {
    const tag = await TagModel.findOneAndDelete(id);
    return res.status(200).json({
      msg: "Tag eliminada correctamente",
      data: tag,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor.",
    });
  }
};

export const updateTag = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const tag = await TagModel.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );
    return res.status(201).json({
      msg: "Tag actualizada correctamente.",
      data: tag,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor.",
    });
  }
};

export const getTagById = async (req, res) => {
  const { id } = req.params;
  try {
    const tag = await TagModel.findById(id);
    return res.status(200).json(tag);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor.",
    });
  }
};
