import { Router } from "express";
import {
  login,
  logout,
  profile,
  register,
  updateProfile,
} from "../controllers/auth.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import {
  createUserValidation,
  updateOnlyProfile,
} from "../middlewares/validations/user.validations.js";
import { validator } from "../middlewares/validator.js";
export const authRouter = Router();

authRouter.post("/register", createUserValidation, validator, register);
authRouter.post("/login", login);
authRouter.post("/logout", validateToken, logout);
authRouter.get("/profile", validateToken, profile);
authRouter.put(
  "/profile",
  validateToken,
  updateOnlyProfile,
  validator,
  updateProfile
);
