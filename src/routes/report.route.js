const reportRouter = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const roleMiddleware = require("../middleware/role.middleware");
// const nearIncidents = require("../controllers/nearIncidents");
const upload = require("../config/multer");
const reportLimiter = require("../middleware/rateLimiter");
const {
  reportIncident,
  getReports,
  deleteReport,
  updateReportStatus,
  nearIncidents,
  getReportById,
  getReportByUser,
} = require("../controllers/report.controller");

reportRouter.post(
  "/",
  verifyToken,
  reportLimiter,
  upload.single("image"),
  reportIncident
);
//get all reports
/*
quer params:
  - page: page number
  - limit: number of reports per page
  - status: status of the report (pending, resolved, rejected)
  - reporterId: id of the reporter
  - tags: tags of the report (comma separated)
  this endpoint is used to access all reports with different filters
*/
reportRouter.get(
  "/",
  verifyToken,
  roleMiddleware("admin", "campus_security"),
  getReports
);

//get reports near to a given location, within 1km radius
//TODO: used by campus security to check for incidents near to them
//TODO: to send notifications to users, that are near to the incident
//accepts lat, lng, timePeriod (in hours) as query params
//timePeriod is optional, default is 48 hours
//returns all reports within 1km radius of the given location, within the given time period

reportRouter.get("/near", verifyToken, nearIncidents);
//get report of the user
reportRouter.get("/user", verifyToken, getReportByUser);
//get report by id
reportRouter.get(
  "/:id",
  verifyToken,
  roleMiddleware("admin", "campus_security"),
  getReportById
);
//delete reports by admin
reportRouter.delete(
  "/:id",
  verifyToken,
  roleMiddleware("admin", "campus_security"),
  deleteReport
);
//update status of incident by admin or campus security
reportRouter.patch(
  "/:id",
  verifyToken,
  upload.none(),
  roleMiddleware("admin", "campus_security"),
  updateReportStatus
);

module.exports = reportRouter;
