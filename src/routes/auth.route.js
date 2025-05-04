const authRouter = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const {
  registerUser,
  logInUser,
  updateUserToken,
} = require("../controllers/auth.controller");
const multer = require("multer");
const upload = multer();

authRouter.post("/register", upload.none(), registerUser);
authRouter.post("/login", upload.none(), logInUser);
//update fcm
authRouter.post("/update_token", upload.none(), verifyToken, updateUserToken);
// authRouter.
// authRouter.post("/logout", logoutUser);// just delete the token in the frontend,

module.exports = authRouter;
