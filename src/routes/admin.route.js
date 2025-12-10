const adminRouter = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const roleMiddleware = require("../middleware/role.middleware");
const { anaylticsController } = require("../controllers/admin.controller");

adminRouter.get(
  "/analytics",
  // verifyToken,
  // roleMiddleware("admin"),
  anaylticsController
);


module.exports = adminRouter;
