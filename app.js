import "dotenv/config";
import express from "express";
const app = express();
const PORT = process.env.PORT;
import cookieParser from "cookie-parser";
import { authRouter } from "./src/routes/auth.route.js";
import { conectDB } from "./src/config/database.js";
import { routeUser } from "./src/routes/user.route.js";
import { tagRouter } from "./src/routes/tag.route.js";
import { routeArticle } from "./src/routes/article.route.js";
import { routeComment } from "./src/routes/comment.route.js";

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/api", routeUser);
app.use("/api", tagRouter);
app.use("/api", routeArticle);
app.use("/api", routeComment);
app.listen(PORT, async () => {
  await conectDB();
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
