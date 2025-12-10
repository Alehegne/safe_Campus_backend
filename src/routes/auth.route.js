const authRouter = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const {
  registerUser,
  logInUser,
  updateUserToken,
  updateTrustedContacts,
  adminController,
  getTrustedContacts,
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

//get trusted contacts
authRouter.get("/get_contacts", verifyToken, getTrustedContacts);

//admin controller

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
