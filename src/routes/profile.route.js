const profileRouter = require("express").Router();
const multer = require("multer");
const upload = multer();
const {
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/profile.controller");
const verifyToken = require("../middleware/verifyToken");

profileRouter.get("/", verifyToken, getProfile);
profileRouter.put("/", upload.none(), verifyToken, updateProfile);
profileRouter.delete("/", upload.none(), verifyToken, deleteProfile);

module.exports = profileRouter;
