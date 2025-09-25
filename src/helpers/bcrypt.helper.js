import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  const saltRounds = 10; // Entre 10-12 es recomendado
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
