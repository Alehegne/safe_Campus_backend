
const rateLimit = require('express-rate-limit');

const reportRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 3, 
  message: {
    success: false,
    message: "Too many reports submitted. Please try again later.",
  },
});

module.exports = reportRateLimiter;