// src/models/user.model.js
import { model, Schema, Types } from "mongoose"; // Asegúrate de importar Types

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Ingrese un email válido."],
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [8, "La contraseña debe tener al menos 8 caracteres"],
      validate: {
        validator: function (v) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v);
        },
        message:
          "La contraseña debe tener mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos",
      },
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    // ESTADO DE VERIFICACIÓN DOCENTE
    // none: No ha solicitado / pending: Solicitó / review: En revisión / verified: Aceptado / rejected: Rechazado
    teacherStatus: {
      type: String,
      enum: ["none", "pending", "review", "verified", "rejected"],
      default: "none",
    },
    profile: {
      firstName: {
        type: String,
        minlength: 2,
        maxlength: 50,
        required: true,
      },
      lastName: {
        type: String,
        minlength: 2,
        maxlength: 50,
        required: true,
      },
      biography: {
        type: String,
        maxlength: 500,
      },
      avatarUrl: {
        type: String,
      },
      // === NUEVO CAMPO BANNER ===
      bannerUrl: {
        type: String,
        default: "assets/img/pred-banner.png", // Imagen predeterminada
      },
      // ==========================
      birthDate: {
        type: String, // Cambiado a String para consistencia con el frontend
      },
    },
    // CAMPO PARA FAVORITOS (PREGUNTAS)
    favorites: [
      {
        type: Types.ObjectId,
        ref: "Article",
      },
    ],
    // NUEVO CAMPO PARA FAVORITOS (RESPUESTAS/COMMENTS)
    favoriteComments: [
      {
        type: Types.ObjectId,
        ref: "Comment",
      },
    ],
    deleteAt: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: { virtuals: true },
    versionKey: false,
    timestamps: true,
  }
);
userSchema.virtual("articles", {
  ref: "Article",
  localField: "_id",
  foreignField: "author",
});

// === INICIO DE LA MODIFICACIÓN ===
// Añadir el virtual populate para los comentarios
userSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "author",
});
// === FIN DE LA MODIFICACIÓN ===

userSchema.pre(/^find/, function (next) {
  this.where({ deleteAt: null });
  next();
});
export const UserModel = model("User", userSchema);
