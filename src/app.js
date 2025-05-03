const express = require("express");
const app = express();
const authRoutes = require("./routes/auth.route");
const profileRoutes = require("./routes/profile.route");
const sosRoutes = require("./routes/panicAlert.route");
const sendResponse = require("./utils/sendResponse");
const routeRoutes = require("./routes/route.route");
const reportRoutes = require("./routes/report.route");
const dangerAreaRoutes = require("./routes/dangerArea.route.js");
const logger = require("./middleware/globalLogger.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//logger middleware
app.use(logger);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/dangerArea", dangerAreaRoutes);

app.get("/", (req, res) => {
  console.log("welcome to safecampus");
  sendResponse(res, 200, true, "welcome to safecampus", {
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
  sendResponse(res, error.status || 500, false, error.message, {
    error: error.message,
    stack: process.env.NODE_ENV === "production" ? null : error.stack,
  });
});

module.exports = app;
