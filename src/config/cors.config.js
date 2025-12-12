const cors = require("cors");

const getCorsConfig = () => {
  return {
    origin: "http://localhost:5173", //frontend origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // credentials: true,
    // accessControlAllowOrigin: true,
  };
};

module.exports = getCorsConfig;
