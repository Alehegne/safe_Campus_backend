const express = require("express");
const app = express();
const authRoutes = require("./routes/auth.route");
const profileRoutes = require("./routes/profile.route");
const routeRoutes = require("./routes/route.route");

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/routes", routeRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "welcome to safecampus",
  });
});

// Error handling
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((error, req, res) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
