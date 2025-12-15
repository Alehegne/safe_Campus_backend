const cors = require("cors");

const getCorsConfig = () => {
  return {
    origin: [
      // React local dev
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",

      // Flutter Android emulator
      "http://10.0.2.2",
      "http://10.0.2.2:3000",
      "http://10.0.2.2:8000",

      // iOS simulator
      "http://localhost",
      "http://127.0.0.1",

      // Render deployments
      "https://campus-safe-admin.vercel.app",
    ], //frontend origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    // accessControlAllowOrigin: true,
  };
};

module.exports = getCorsConfig;
