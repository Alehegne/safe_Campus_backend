const sendResponse = require("../utils/sendResponse");
const {
  getDangerService,
  saveRiskZone,
  deleteDangerArea,
} = require("../services/dangerMap.service");

async function getDangerArea(req, res) {
  try {
    console.log("Getting dangerous area...");
    const dangerArea = await getDangerService(req.query);
    console.log("fetched dangerous area:", dangerArea);
    sendResponse(
      res,
      200,
      true,
      "Successfully fetched dangerous area",
      dangerArea
    );
  } catch (error) {
    console.error("Error in fetching dangerous area:", error.message);
    sendResponse(
      res,
      400,
      false,
      "Failed to fetch dangerous area",
      null,
      error.message
    );
  }
}

async function postRiskZone(req, res) {
  try {
    console.log("Creating risk zone...");

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendResponse(res, 400, false, "Request body is empty");
    }

    const { severity, types } = req.body;
    const { user } = req;

    // Parse and validate location
    let location;
    if (typeof req.body.location === "string") {
      try {
        location = JSON.parse(req.body.location);
      } catch (parseError) {
        return sendResponse(res, 400, false, "Invalid location JSON format");
      }
    } else if (req.body.location && typeof req.body.location === "object") {
      location = req.body.location;
    } else {
      return sendResponse(
        res,
        400,
        false,
        "Location must be a valid JSON object"
      );
    }

    // Validate required fields
    if (!location || !severity) {
      return sendResponse(
        res,
        400,
        false,
        "Missing required fields: location and severity are required"
      );
    }

    // Validate coordinates
    if (!location.coordinates || !Array.isArray(location.coordinates)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid location format: coordinates array is required"
      );
    }

    const [lon, lat] = location.coordinates;
    const coordinates = [parseFloat(lon), parseFloat(lat)];

    if (coordinates.some((coord) => isNaN(coord) || coord === null)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid coordinates: must be valid numbers"
      );
    }

    // Validate latitude/longitude ranges (optional but recommended)
    if (
      coordinates[0] < -180 ||
      coordinates[0] > 180 ||
      coordinates[1] < -90 ||
      coordinates[1] > 90
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90"
      );
    }

    // Prepare data with correct field names
    const data = {
      location: {
        type: location.type || "Point",
        coordinates: coordinates,
      },
      severity: severity,
      types: types || [],
      source: user?.role || "user",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedRisk = await saveRiskZone(data);
    return sendResponse(
      res,
      201, // Use 201 for resource creation
      true,
      "Risk zone successfully created",
      savedRisk
    );
  } catch (error) {
    console.error("Error in creating risk zone:", error.message);
    sendResponse(
      res,
      500,
      false,
      "Failed to create risk zone",
      null,
      process.env.NODE_ENV === "development" ? error.message : null
    );
  }
}

async function deleteRiskZone(req, res) {
  try {
    console.log("Deleting risk zone...");
    const { id } = req.params;

    if (!id) {
      return sendResponse(res, 400, false, "Risk zone ID is required");
    }

    const deleted = await deleteDangerArea(id);

    if (!deleted) {
      return sendResponse(res, 404, false, "Risk zone not found");
    }

    sendResponse(res, 200, true, "Risk zone successfully deleted", deleted);
  } catch (error) {
    console.error("Error in deleting risk zone:", error.message);
    sendResponse(
      res,
      500,
      false,
      "Failed to delete risk zone",
      null,
      error.message
    );
  }
}

module.exports = {
  getDangerArea,
  postRiskZone,
  deleteRiskZone,
};
