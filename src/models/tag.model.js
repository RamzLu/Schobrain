import { model, Schema } from "mongoose";
import { ArticleModel } from "./article.model.js";

const tagSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      minlength: 2,
      maxlength: 50,
      required: true,
    },
    description: {
      type: String,
      maxlength: 200,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);
// los hooks de middleware (pre y post)
// no existen específicamente para findByIdAndDelete, solo para findOneAndDelete, findOneAndUpdate, etc
tagSchema.post("findOneAndDelete", async (tag) => {
  try {
    // tag seria la tag eliminada
    if (tag) {
      await ArticleModel.updateMany(
        // si hay una tag que coincide con el _id de la tag eliminada
        { tags: tag._id },
        // $pull en MongoDB elimina de un arreglo todos los elementos que coincidan con la condición que le pases
        // entonces usamos pull para quitar su _id de los array de tag del articulo
        { $pull: { tags: tag._id } }
      );
    }
    console.log(`La tag ${tag.name} ha sido eliminada de todos los articulos`);
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      msg: "Error interno del servidor.",
    });
  }
});
export const TagModel = model("Tag", tagSchema);
