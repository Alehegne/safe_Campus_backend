const authRouter = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const {
  registerUser,
  logInUser,
  updateUserToken,
  updateTrustedContacts,
  adminController,
} = require("../controllers/auth.controller");
const multer = require("multer");
const roleMiddleware = require("../middleware/role.middleware");
const upload = multer();

authRouter.post("/register", upload.none(), registerUser);
authRouter.post("/login", upload.none(), logInUser);
//update fcm
authRouter.post("/update_token", upload.none(), verifyToken, updateUserToken);
//update trusted contacts
authRouter.patch(
  "/update_contacts",
  upload.none(),
  verifyToken,
  updateTrustedContacts
);
authRouter.post(
  "/admin",
  upload.none(),
  verifyToken,
  roleMiddleware("admin"),
  adminController
);
// authRouter.
// authRouter.post("/logout", logoutUser);// just delete the token in the frontend,

module.exports = authRouter;
