import mongoose from "mongoose";

export const conectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // await mongoose.connection.dropDatabase();
    console.log("DB conectada correctamente.");
  } catch (error) {
    console.log("No se pudo conectar a la BD", error);
  }
};
