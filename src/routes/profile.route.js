import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateAvatar,
} from "../controllers/profile.controller.js";
import { validateToken } from "../middlewares/authMiddleware.js";
import multer from "multer";

const upload = multer({ dest: "public/uploads/" });

const profileRouter = Router();

profileRouter.get("/", validateToken, getProfile);
profileRouter.put("/", validateToken, updateProfile);
profileRouter.put(
  "/avatar",
  validateToken,
  upload.single("avatar"),
  updateAvatar
);

export default profileRouter;
