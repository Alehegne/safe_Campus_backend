function getCorsConfig() {
  return {
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    origin:
      process.env.NODE_ENV === "production" ? process.env.ALLOWEDORIGINS : "*",
  };
}

module.exports = getCorsConfig;
