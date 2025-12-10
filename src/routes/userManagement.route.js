const userRouter = require("express").Router();
const { getAllUsers } = require("../controllers/userManagement.controller");
const verifyToken = require("../middleware/verifyToken");
const roleMiddleware = require("../middleware/role.middleware");

// All routes require authentication
userRouter.use(verifyToken);

// Only admin can access user management routes
// userRouter.use(roleMiddleware("admin"));

// Route to get all users
userRouter.get("/", getAllUsers);

module.exports = userRouter;
