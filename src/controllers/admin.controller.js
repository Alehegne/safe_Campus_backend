const sendResponse = require("../utils/sendResponse");
const User = require("../models/user.model");
const Report = require("../models/incidentModel");
const Alerts = require("../models/panicEvent.model");
const DangerArea = require("../models/dangerArea.model");

async function anaylticsController(req, res) {
  try {
  } catch (error) {
    sendResponse(res, 500, false, "Internal Server Error", {
      error: error.message,
    });
  }
}

module.exports = {
  anaylticsController,
};
