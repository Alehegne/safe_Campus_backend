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
  pauseRoute,
  getSharedWithMe,
} = require("../controllers/route.controller");
const verifyToken = require("../middleware/verifyToken");
const multer = require("multer");

const upload = multer();

// All routes require authentication
routeRouter.use(verifyToken);

// Route listing and management
routeRouter.get("/", verifyToken, getAllUserRoutes);
routeRouter.get("/shared-with-me", verifyToken, getSharedWithMe);
routeRouter.post("/start", verifyToken, upload.none(), startRoute);
routeRouter.post("/:routeId/stop", verifyToken, upload.none(), stopRoute);
routeRouter.post("/:routeId/pause", verifyToken, upload.none(), pauseRoute);
routeRouter.patch("/:routeId", verifyToken, upload.none(), updateRouteDetails);
routeRouter.post(
  "/:routeId/location",
  verifyToken,
  upload.none(),
  updateRouteLocation
);
routeRouter.get("/:routeId/status", verifyToken, getRouteStatus);

// Route sharing endpoints
routeRouter.post("/:routeId/share", verifyToken, upload.none(), shareRoute);
routeRouter.get("/:routeId/shared", verifyToken, getSharedRoute);

module.exports = routeRouter;
