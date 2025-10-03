import mongoose from "mongoose";
import { TagModel } from "../models/tag.model.js";

const predefinedTags = [
  { name: "Matemáticas", description: "Preguntas sobre matemáticas" },
  { name: "Lengua", description: "Preguntas sobre lengua y literatura" },
  { name: "Ciencias", description: "Preguntas sobre ciencias naturales" },
  { name: "Historia", description: "Preguntas sobre historia" },
  { name: "Programación", description: "Preguntas sobre programación" },
  {
    name: "Estadísticas y Cálculo",
    description: "Preguntas sobre estadísticas y cálculo",
  },
  { name: "Castellano", description: "Preguntas sobre castellano" },
  { name: "Inglés", description: "Preguntas sobre inglés" },
];

const seedTags = async () => {
  try {
    for (const tag of predefinedTags) {
      const existingTag = await TagModel.findOne({ name: tag.name });
      if (!existingTag) {
        await TagModel.create(tag);
        console.log(`Tag '${tag.name}' creado.`);
      }
    }
  } catch (error) {
    console.error("Error al crear tags predefinidos:", error);
  }
};

export const conectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // await mongoose.connection.dropDatabase();
    console.log("DB conectada correctamente.");
    await seedTags();
  } catch (error) {
    console.log("No se pudo conectar a la BD", error);
  }
};
