import mongoose from "mongoose";
import { TagModel } from "../models/tag.model.js";

const predefinedTags = [
  // Asignaturas existentes
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

  // Nuevas asignaturas
  {
    name: "Ciencias Sociales",
    description: "Preguntas sobre ciencias sociales",
  },
  { name: "Geografía", description: "Preguntas sobre geografía" },
  { name: "Derecho", description: "Preguntas sobre derecho" },
  { name: "Contabilidad", description: "Preguntas sobre contabilidad" },
  { name: "Física", description: "Preguntas sobre física" },
  { name: "Química", description: "Preguntas sobre química" },
  { name: "Salud", description: "Preguntas sobre salud y bienestar" },
  { name: "Biología", description: "Preguntas sobre biología" },
  { name: "Informática", description: "Preguntas sobre informática" },
  {
    name: "Tecnología y Electrónica",
    description: "Preguntas sobre tecnología y electrónica",
  },
  { name: "Religión", description: "Preguntas sobre religión" },
  { name: "Filosofía", description: "Preguntas sobre filosofía" },
  { name: "Psicología", description: "Preguntas sobre psicología" },
  { name: "Educ. Fisica", description: "Preguntas sobre educación física" },
  { name: "Arte", description: "Preguntas sobre arte" },
  { name: "Musica", description: "Preguntas sobre música" },
  { name: "Francés", description: "Preguntas sobre el idioma francés" },
  { name: "Alemán", description: "Preguntas sobre el idioma alemán" },
  { name: "Latín / Griego", description: "Preguntas sobre latín y griego" },
  {
    name: "Análisis de la materia y la energía",
    description: "Preguntas sobre análisis de la materia y la energía",
  },
  {
    name: "Tratamiento de datos y azar",
    description: "Preguntas sobre tratamiento de datos y azar",
  },
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
