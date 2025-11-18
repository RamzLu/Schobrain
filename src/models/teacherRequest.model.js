// src/models/teacherRequest.model.js
import { model, Schema, Types } from "mongoose";

const teacherRequestSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    dni: {
      type: String,
      required: true,
    },
    specialty: {
      type: String, // Ej: Matemáticas, Historia, etc.
      required: true,
    },
    description: {
      type: String, // Breve descripción de su experiencia
    },
    documents: [
      {
        type: String, // URLs o paths de los archivos subidos
      },
    ],
    status: {
      type: String,
      enum: ["pending", "review", "verified", "rejected"],
      default: "pending",
    },
    adminComments: {
      type: String, // Feedback del admin si rechaza o acepta
      default: "",
    },
    reviewedBy: {
      type: Types.ObjectId,
      ref: "User", // Admin que revisó la solicitud
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const TeacherRequestModel = model(
  "TeacherRequest",
  teacherRequestSchema
);
