export const authAdmin = (req, res, next) => {
  const user = req.userLog;
  try {
    if (user.role !== "admin") {
      return res.status(400).json({
        msg: "No tienes los permisos para acceder a este recurso.",
      });
    }
    next();
  } catch (error) {}
};
