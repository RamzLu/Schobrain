import { model, Schema, Types } from "mongoose";
import { UserModel } from "./user.model.js";
import { TagModel } from "./tag.model.js";
import { CommentModel } from "./comment.model.js";

const articleSchema = new Schema(
  {
    content: {
      type: String,
      minlength: 10,
      required: true,
    },
    status: {
      type: String,
      enum: ["published", "archived"],
      default: "published",
    },
    author: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: async function (value) {
          const existAuhtor = await UserModel.findById(value);
          return !!existAuhtor;
        },
        message: "El autor referenciado no existe.",
      },
    },
    tags: {
      type: [Types.ObjectId],
      ref: "Tag",
    },
    imageUrls: {
      type: [String],
      required: false,
    },
    // CAMPOS PARA VOTACIÓN
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    votedUp: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    votedDown: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

articleSchema.post("findOneAndDelete", async function (doc) {
  // doc es el articulo borrado
  if (doc) {
    try {
      await CommentModel.deleteMany({ article: doc._id });
    } catch (error) {
      console.error("Error durante el borrado en cascada:", error);
    }
  }
});

articleSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "article",
});
export const ArticleModel = model("Article", articleSchema);
