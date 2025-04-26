const routeRouter = require("express").Router();
const {
  startRoute,
  stopRoute,
  updateRouteLocation,
  getRouteStatus,
  shareRoute,
  getSharedRoute,
  getAllUserRoutes,
  updateRouteDetails,
  pauseRoute
} = require("../controllers/route.controller");
const verifyToken = require("../middleware/verifyToken");

// All routes require authentication
routeRouter.use(verifyToken);

// Route listing and management
routeRouter.get("/", getAllUserRoutes);
routeRouter.post("/start", startRoute);
routeRouter.post("/:routeId/stop", stopRoute);
routeRouter.post("/:routeId/pause", pauseRoute);
routeRouter.patch("/:routeId", updateRouteDetails);
routeRouter.post("/:routeId/location", updateRouteLocation);
routeRouter.get("/:routeId/status", getRouteStatus);

// Route sharing endpoints
routeRouter.post("/:routeId/share", shareRoute);
routeRouter.get("/:routeId/shared", getSharedRoute);

module.exports = routeRouter; 