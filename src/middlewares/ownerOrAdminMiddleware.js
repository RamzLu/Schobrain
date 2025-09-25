export const ownerOrAdmin = (model) => {
  return async (req, res, next) => {
    const { id } = req.params;
    const user = req.userLog;

    try {
      if (user.role === "admin") {
        return next();
      }
      const resource = await model.findOne({
        _id: id,
        author: user.id,
      });

      if (!resource) {
        return res.status(403).json({
          message:
            "No tienes permiso para realizar esta acción en este recurso.",
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        msg: "Error interno del servidor.",
      });
    }
  };
};
