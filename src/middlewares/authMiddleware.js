import jwt from "jsonwebtoken";

export const validateToken = (req, res, next) => {
  const token = req.cookies.token;
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
