const multer = require("multer");
const cloudinaryStorage = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinaryConfig");

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "reports",
  allowedFormats: ["jpeg", "jpg", "png"],
  transformation: [{ width: 500, height: 500, crop: "limit" }],
});

const upload = multer({ storage });

module.exports = upload;
