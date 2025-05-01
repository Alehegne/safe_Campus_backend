const rateLimit = require("express-rate-limit");

const reportRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message: "Too many reports submitted. Please try again later.",
  },
});

module.exports = reportRateLimiter;
