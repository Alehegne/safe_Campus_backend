const cors = require("cors");

const allowedOrigins = [
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

const getCorsConfig = () => {
  return {
    origin: function (origin, callback) {
          if (!origin) return callback(null, true); // Allow requests without origin (e.g., Postman)
          if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
          }
          return callback(null, true);
        },
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies to be sent
    exposedHeaders: ["Content-Length", "X-JSON"],
    maxAge: 86400, // 24 hours for preflight cache
    optionsSuccessStatus: 204, // For legacy browser support
    preflightContinue: false,
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false, 
  };
};

module.exports = getCorsConfig;
