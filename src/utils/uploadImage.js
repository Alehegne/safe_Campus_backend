const cloudinary = require("../config/cloudinaryConfig");
async function uploadImage(mimeType, image) {
  //check if the image is a valid image type
  const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!validImageTypes.includes(mimeType)) {
    throw new Error(
      "Invalid image type. Please upload a valid image type (jpeg, png, gif)"
    );
  }

  //upload image to cloudinary, and get the url
  const image_url = await cloudinary.uploader.upload(image);
  if (!image_url || !image_url.secure_url) {
    throw new Error("Error uploading image to cloudinary");
  }
  return image_url.secure_url;
}

module.exports = uploadImage;
