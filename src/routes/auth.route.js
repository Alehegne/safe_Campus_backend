const authRouter = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const {
  registerUser,
  logInUser,
  updateUserToken,
  updateTrustedContacts,
  getTrustedContacts,
  refrehToken,
  addTrustedContacts,
  deleteTrustedContacts,
} = require("../controllers/auth.controller");
const User = require("../models/user.model");
const multer = require("multer");
const roleMiddleware = require("../middleware/role.middleware");
const upload = multer();
//temp endpoint for adding admin user

// async function adminRegister(req, res) {
//   try {
//     const { name, email, password } = req.body;
//     const existingAdmin = await User.findOne({ email: email });
//     if (existingAdmin) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Admin already exists" });
//     }
//     const newAdmin = new User({
//       name,
//       email,
//       password,
//       role: "admin",
//     });
//     await newAdmin.save();
//     console.log("Admin user created:", newAdmin);
//     return res
//       .status(201)
//       .json({ success: true, message: "Admin user created successfully" });
//   } catch (error) {
//     console.error("Error creating admin user:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// }

// authRouter.post("/admin_add", upload.none(), adminRegister);

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
//delete trusted contacts
authRouter.delete(
  "/delete_contacts",
  upload.none(),
  verifyToken,
  deleteTrustedContacts
);
//add trusted contacts
authRouter.post(
  "/add_contacts",
  upload.none(),
  verifyToken,
  addTrustedContacts
);

//get trusted contacts
authRouter.get("/get_contacts", verifyToken, getTrustedContacts);
//refresh token
authRouter.post("/refresh", refrehToken);

//admin controller

// authRouter.post(
//   "/admin",
//   upload.none(),
//   verifyToken,
//   roleMiddleware("admin"),
//   adminController
// );

// authRouter.
// authRouter.post("/logout", logoutUser); // just delete the token in the frontend,

module.exports = authRouter;
