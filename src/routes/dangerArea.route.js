const dangerArea = require("express").Router();
const {
  getDangerArea,
  postRiskZone,
  deleteRiskZone,
} = require("../controllers/dangerArea.controller.js");
const multer = require("multer");
const upload = multer();
const verifyToken = require("../middleware/verifyToken.js");
const roleMiddleware = require("../middleware/role.middleware.js");

/*
  * * get all dangerous areas
    * * query params:
    * * - page: page number
    * * - limit: number of reports per page
    * * - status: status of the report (active, under investigation, resolved)
    * * -types: types of the report(theft, assault, vandalism, harassment, other)
    * * - severity: severity of the report (low, medium, high)
    * * - source: source of the report (user, admin, campus_security, anonymous, other)

*/
dangerArea.get("/", verifyToken, getDangerArea);
//create risk-zone by admin and security
dangerArea.post(
  "/",
  verifyToken,
  roleMiddleware("admin", "campus_security"),
  upload.none(),
  postRiskZone
);
//delete risk-zone by admin and security
dangerArea.delete(
  "/:id",
  verifyToken,
  roleMiddleware("admin", "campus_security"),
  deleteRiskZone
);

module.exports = dangerArea;
