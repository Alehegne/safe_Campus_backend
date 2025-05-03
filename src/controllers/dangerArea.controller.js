const sendResponse = require("../utils/sendResponse");
const {
  getDangerService,
  saveRiskZone,
  deleteDangerArea,
} = require("../services/dangerMap.service");

async function getDangerArea(req, res) {
  try {
    console.log("getting dangerous area...");
    const dangerArea = await getDangerService(req.query);
    sendResponse(
      res,
      200,
      true,
      "successfully fetched dangerous area",
      dangerArea
    );
  } catch (error) {
    console.log("error in fetching dangerous area");
    sendResponse(res, 400, false, "error in fetching dangerous area");
  }
}
async function postRiskZone(req, res) {
  try {
    console.log("creating risk zone...");
    if (!req.body) {
      sendResponse(
        res,
        401,
        false,
        "request body is empty",
        null,
        "request body is empty"
      );
      return;
    }
    const { severity, types } = req.body;
    const { user } = req;
    let location;
    try {
      if (typeof req.body.location === "String") {
        location = JSON.parse(req.body.location);
      } else if (typeof req.body.location === "Object") {
        location = req.body.location;
      } else {
        sendResponse(
          res,
          401,
          false,
          "please provide a valid json for location",
          null,
          "error in parsing location"
        );
      }
    } catch (error) {
      sendResponse(
        res,
        401,
        false,
        "please provide a valid json for location",
        null,
        "error in parsing location"
      );
    }

    if (!location || !severity || !types) {
      sendResponse(
        res,
        401,
        false,
        "provide neccessary fields",
        null,
        "provide neccessary fileds"
      );
    }
    const coordinates = [
      parseFloat(location.coordinates[0]),
      parseFloat(location.coordinates[1]),
    ];
    if (
      !location.coordinates ||
      isNaN(coordinates[0]) ||
      isNaN(coordinates[1])
    ) {
      return sendResponse(
        res,
        400,
        false,
        "please provide correct coordiantes",
        null,
        "provide correct coordiantes"
      );
    }

    const data = {
      location,
      severiry: severity,
      types,
      // source: user.role,
      source: user.role,
      status: "active",
    };
    const savedRisk = await saveRiskZone(data);
    return sendResponse(
      res,
      200,
      true,
      "risk zone successfully saved",
      savedRisk,
      null
    );
  } catch (error) {
    console.log("error in creating ris zone");
    sendResponse(res, 400, false, "error in creating risk zone ");
  }
}
async function deleteRiskZone(req, res) {
  try {
    console.log("deleting risk zone...");
    const { id } = req.params;
    if (!id) {
      sendResponse(
        res,
        401,
        false,
        "please provide id",
        null,
        "please provide id"
      );
      return;
    }
    const deleted = await deleteDangerArea(id);

    sendResponse(res, 200, true, "deleted successfully", deleted, null);
  } catch (error) {
    console.log("error in deleting risk zone");
    sendResponse(res, 400, false, "error in deleting risk zone ");
  }
}

module.exports = {
  getDangerArea,
  postRiskZone,
  deleteRiskZone,
};
