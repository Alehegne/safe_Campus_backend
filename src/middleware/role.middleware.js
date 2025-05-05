module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    console.log("Allowed roles:", allowedRoles);
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      console.log(
        `User role: ${req.user?.role}, Allowed roles: ${allowedRoles}`
      );

      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};
