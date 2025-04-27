const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const allowedRoles = require("../middleware/role.middleware");
const multer = require("multer");
const {
  responseHandler,
  triggerPanicEvent,
  emailViewTracker,
  resolvedPanicEvent,
  updateNotifiedContacts,
  updateAcknowledgedContacts,
  getAllPanicEvents,
  getAllPanicByUserId,
} = require("../controllers/sos.controller");

const upload = multer();
const router = express.Router();

router.post("/trigger", upload.none(), verifyToken, triggerPanicEvent);
//get all panic events
router.get(
  "/get-all",
  verifyToken,
  allowedRoles("admin", "campus_security"),
  getAllPanicEvents
);
//get all panic events for a user
router.get("/user", verifyToken, getAllPanicByUserId);
//update yes/no acknowledgedBy, from gmail
router.get("/response", responseHandler);
// update the notified contacts and guards
router.get("/email-view-tracker", emailViewTracker);

//update the resolved panic event
router.put(
  "/update/:eventId",
  verifyToken,
  allowedRoles("admin", "campus_security"),
  resolvedPanicEvent
);
//add notified contacts and guards
router.put(
  "/update-notified/:eventId",
  verifyToken,
  upload.none(),
  updateNotifiedContacts
);
//update acknowledgedBy, from users and guards app
router.put(
  "/update-acknowledged/:eventId",
  verifyToken,
  upload.none(),
  updateAcknowledgedContacts
);
module.exports = router;
