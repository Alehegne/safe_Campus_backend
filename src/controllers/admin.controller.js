const sendResponse = require("../utils/sendResponse");
const User = require("../models/user.model");
const Report = require("../models/incidentModel");
const Alerts = require("../models/panicEvent.model");
const DangerArea = require("../models/dangerArea.model");

async function anaylticsController(req, res) {
  try {
    const totalUser = await User.countDocuments();
    const totalReports = await Report.countDocuments();
    const solvedAlerts = await Alerts.countDocuments({ resolved: true });
    const unresolvedAlerts = await Alerts.countDocuments({ resolved: false });
    const totalUsers = await User.countDocuments();
    // incident rate calculation
    const incidentRate =
      totalUsers === 0 ? 0 : (totalReports / totalUsers) * 100;

    const dangerAreas = await DangerArea.find();
    const dangerAreaCount = dangerAreas.length;
    sendResponse(res, 200, true, "Analytics data fetched successfully", {
      totalUser,
      totalReports,
      solvedAlerts,
      unresolvedAlerts,
      incidentRate: incidentRate.toFixed(2), // rounding to 2 decimal places
      dangerAreaCount,
    });
  } catch (error) {
    sendResponse(res, 500, false, "Internal Server Error", {
      error: error.message,
    });
  }
}

module.exports = {
  anaylticsController,
};
