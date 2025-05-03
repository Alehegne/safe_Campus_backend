function getCorsConfig() {
  return {
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    origin: "*",
  };
}

module.exports = getCorsConfig;
