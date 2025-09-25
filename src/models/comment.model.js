import { model, Schema, Types } from "mongoose";
import { ArticleModel } from "./article.model.js";
import { UserModel } from "./user.model.js";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      minlength: 5,
      maxlength: 500,
      required: true,
    },
    author: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      // *validar si la referencia existe
      validate: {
        validator: async function (value) {
          const existAuthor = await UserModel.findById(value);
          return !!existAuthor;
        },
        message: "El autor referenciado no existe.",
      },
    },
    //   * RELACIÓN 1:N con Article
    article: {
      type: Types.ObjectId,
      ref: "Article",
      required: true,
      // *validar si la referencia existe
      validate: {
        validator: async function (value) {
          const existArticle = await ArticleModel.findById(value);
          // * !!exist devuelve true si el articulo existe, sino false
          return !!existArticle;
        },
        message: "El articulo referenciado no existe.",
      },
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const CommentModel = model("Comment", commentSchema);
