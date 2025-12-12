const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: { v2: cloudinary },  // v2 wrapping required only in v2
  params: { folder: 'reports', allowed_formats: ['jpg', 'png', 'jpeg'] },
});

const upload = require('multer')({ storage });
module.exports = upload;
