const express = require('express');
const router = express.Router();
const upload = require('./src/config/multer');
const uploadDb = require('./src/controllers/uploadController');
const reportLimiter = require('./src/middlewares/rateLimiter');
const verifyToken = require('./src/middlewares/verifyToken');
router.post('/report', verifyToken, reportLimiter, upload.single('image'), uploadDb);

module.exports = router;
