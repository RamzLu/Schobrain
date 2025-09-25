import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      // * username es único
      unique: true,
      required: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      unique: true,
      // * email es único
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Ingrese un email válido."],
    },
    password: {
      type: String,
      // *la password es obligatoria
      // TODO: Si se desea mandar un mensaje con validaciones basta con poner el valor del requisito en array []
      required: [true, "La contraseña es obligatoria"],
      // * debe contener al menos 8 caracteres
      minlength: [8, "La contraseña debe tener al menos 8 caracteres"],
      validate: {
        validator: function (v) {
          // * Aqui validamos  que contenga al menos una mayúscula, una  minuscula, un numero y un simbolo
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
      birthDate: {
        type: String,
      },
    },
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

userSchema.pre(/^find/, function (next) {
  this.where({ deleteAt: null });
  next();
});
export const UserModel = model("User", userSchema);
