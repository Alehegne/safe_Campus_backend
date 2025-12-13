const alertsRouter = require("express").Router();
const roleMiddleware = require("../middleware/role.middleware");
const verifyToken = require("../middleware/verifyToken");
const AlertsModel = require("../models/alerts.model");
const sendResponse = require("../utils/sendResponse");

async function getAlerts(req, res) {
  try {
    //get all alerts wth type alert

    const alerts = await AlertsModel.find({ type: "alert" }).sort({ time: -1 });
    return sendResponse(
      res,
      200,
      true,
      "alerts fetched successfully",
      alerts,
      null
    );
  } catch (error) {
    return sendResponse(res, 500, false, "server error", null, null);
  }
}
async function getAnnouncements(req, res) {
  try {
    const announcements = await AlertsModel.find({ type: "announcement" }).sort(
      { time: -1 }
    );
    return sendResponse(
      res,
      200,
      true,
      "Announcements retrieved successfully",
      announcements
    );
  } catch (error) {
    return sendResponse();
  }
}
async function createAlert(req, res) {
  try {
    const { title, content, status, type } = req.body;
    const newAlert = new AlertsModel({
      title,
      content,
      status,
      type,
    });
    await newAlert.save();
    return sendResponse(
      res,
      201,
      true,
      "Alert created successfully",
      newAlert,
      null
    );
  } catch (error) {
    return sendResponse(res, 500, false, "server error", null, null);
  }
}

async function deleteAlert(req, res) {
  try {
    console.log("Delete alert called");
    const alertId = req.params.id;
    const deletedAlert = await AlertsModel.findByIdAndDelete(alertId);
    if (!deletedAlert) {
      return sendResponse(res, 404, false, "Alert not found", null, null);
    }
    return sendResponse(
      res,
      200,
      true,
      "Alert deleted successfully",
      deletedAlert,
      null
    );
  } catch (error) {
    return sendResponse(res, 500, false, "server error", null, null);
  }
}

alertsRouter.get("/alerts", verifyToken, getAlerts);
alertsRouter.get("/announcements", verifyToken, getAnnouncements);
alertsRouter.post("/alerts", verifyToken, roleMiddleware("admin"), createAlert);
//delete alert
alertsRouter.delete(
  "/alerts/:id",
  verifyToken,
  roleMiddleware("admin"),
  deleteAlert
);

module.exports = alertsRouter;
