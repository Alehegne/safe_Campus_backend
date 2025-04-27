const authRouter = require("express").Router();
const { registerUser, logInUser } = require("../controllers/auth.controller");
const multer = require("multer");
const upload = multer();

authRouter.post("/register", upload.none(), registerUser);
authRouter.post("/login", upload.none(), logInUser);
// authRouter.
// authRouter.post("/logout", logoutUser);// just delete the token in the frontend,

module.exports = authRouter;
