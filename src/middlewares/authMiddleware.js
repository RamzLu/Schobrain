import jwt from "jsonwebtoken";

export const validateToken = (req, res, next) => {
  // Busca el token en cookies o en el header Authorization
  const token =
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  if (!token) {
    return res.status(401).json({ msg: "Token requerido, debes logearte." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userLog = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      msg: "Token no válido, debes logearte.",
    });
  }
};
