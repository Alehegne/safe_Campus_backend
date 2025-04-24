function getSocketConfig() {
  return {
    cors: {
      origin:
        process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  };
}
module.exports = getSocketConfig;
