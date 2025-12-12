const cloudinary = require("../config/cloudinaryConfig");

async function uploadImage(mimeType, imagePath) {
  const validImageTypes = ["image/jpeg", "image/png", "image/gif"];

  if (!validImageTypes.includes(mimeType)) {
    throw new Error("Invalid image type (jpeg, png, gif only)");
  }
  // console.log("imagePath:",imagePath);

  const image = await cloudinary.uploader.upload(imagePath);

  if (!image.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return image.secure_url;
}

module.exports = uploadImage;

// const cloudinary = require('../config/cloudinaryConfig');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const multer = require('multer');

// const storage = new CloudinaryStorage({
//   cloudinary: { v2: cloudinary },   // <-- REQUIRED FIX
//   params: {
//     folder: 'reports',
//     allowed_formats: ['jpg', 'png', 'jpeg'],
//   },
// });

// const upload = multer({ storage });

// module.exports = upload;
