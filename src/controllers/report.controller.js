const sendResponse = require("../utils/sendResponse");
const {
  saveReport,
  deleteReportService,
  getReportService,
  updateStatus,
  getNearIncidents,
  reportById,
} = require("../services/report.service");
const { default: mongoose } = require("mongoose");
const uploadImage = require("../utils/uploadImage");
const cacheKey = require("../utils/cache/cacheKey");
const {
  getOrSetCache,
  delCacheByPrefix,
} = require("../utils/cache/cacheService");
const { saveDangerMap } = require("../services/dangerMap.service");

async function reportIncident(req, res) {
  try {
    console.log("reporting incident...");
    const { description, anonymous, tag } = req.body;
    const location = JSON.parse(req.body.location);
    if (!description || !location || !location.coordinates) {
      return sendResponse(
        res,
        400,
        false,
        "Incomplete form",
        null,
        "Please fill in all required fields"
      );
    }

    const coordinates = [
      parseFloat(location.coordinates[0]),
      parseFloat(location.coordinates[1]),
    ]; // [longitude, latitude]

    if (
      coordinates.length !== 2 ||
      isNaN(coordinates[0]) ||
      isNaN(coordinates[1])
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid coordinates",
        null,
        "Coordinates must be an array of two numbers [longitude, latitude]"
      );
    }

    //upload image to cloudinary
    const evidenceImage = req.file?.path;
    let image_url = null;
    if (evidenceImage) {
      image_url = await uploadImage(req.file.mimetype, evidenceImage);
    }

    const incidentData = {
      description,
      location,
      anonymous,
      evidenceImage: image_url,
      tag: tag,
    };
    if (!anonymous && req.user) {
      incidentData.reporterId = req.user.userId;
    }

    const incident = await saveReport(incidentData);
    if (!incident) {
      return sendResponse(
        res,
        500,
        false,
        "Error reporting incident",
        null,
        "Error reporting incident"
      );
    }

    // invalidate cache for reports
    //invalidate all caches with the prefix "reports::"
    delCacheByPrefix(cacheKey.reports());
    // console.log("incidentData:", incident);
    //save the incident to dangerMap
    const dangerMapData = {
      location: {
        type: "Point",
        coordinates: coordinates,
      },
      severiry: "low",
      reportCount: 1,
      source: anonymous ? "anonymous" : incident?.reporterId?.role,
      status: "active",
      types: incidentData?.tag,
      reportId: incident._id,
      lastReportedAt: Date.now(),
    };
    await saveDangerMap(dangerMapData);

    return sendResponse(
      res,
      200,
      true,
      "Incident reported successfully",
      incident,
      "Incident reported successfully"
    );
  } catch (error) {
    console.error("Error reporting incident:", error);
    return sendResponse(res, 500, false, "Error reporting incident");
  }
}

async function getReports(req, res) {
  try {
    console.log("getting reports...");
    const reportCacheKey = cacheKey.reports(req.query);
    // console.log("reportCacheKey", reportCacheKey);
    // delCache(reportCacheKey); // Clear the cache for reports
    const { reports, analysis } = await getOrSetCache(
      reportCacheKey,
      async () => {
        const { reports, analysis } = await getReportService(req.query);
        return {
          reports,
          analysis,
        };
      },
      5 * 60 // Cache for 5 minutes
    );
    // console.log("keys:", getKeysCache());
    // console.log("values:", getCache(reportCacheKey));
    if (!reports) {
      return sendResponse(
        res,
        500,
        false,
        "Error getting reports",
        null,
        "Error getting reports"
      );
    }
    return sendResponse(
      res,
      200,
      true,
      "Reports retrieved successfully",
      { reports, analysis },
      "Reports retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting reports:", error);
    return sendResponse(res, 500, false, "Error getting reports");
  }
}
async function deleteReport(req, res) {
  try {
    console.log("deleting report...");
    const { id } = req.params;
    const report = await deleteReportService(id);
    if (!report) {
      return sendResponse(
        res,
        404,
        false,
        "Report not found",
        null,
        "Report not found"
      );
    }
    // Invalidate the cache for the deleted report
    //will delete a cache with the given id
    delCacheByPrefix(cacheKey.reportById(id));
    return sendResponse(
      res,
      200,
      true,
      "Report deleted successfully",
      null,
      "Report deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting report:", error);
    return sendResponse(res, 500, false, "Error deleting report");
  }
}
async function updateReportStatus(req, res) {
  try {
    console.log("updating report status...");
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(
        res,
        400,
        false,
        "Report ID is required",
        null,
        "Report ID is required"
      );
    }
    if (!req.body || !req.body.status) {
      return sendResponse(
        res,
        400,
        false,
        "Status is required",
        null,
        "Status is required"
      );
    }
    console.log("req.body.status");
    const { status } = req.body;
    const validStatuses = ["resolved", "pending", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return sendResponse(
        res,
        400,
        false,
        "Status is required",
        null,
        "Status is required"
      );
    }
    const updatedReport = await updateStatus(id, status);
    if (!updatedReport) {
      return sendResponse(
        res,
        404,
        false,
        "Report not found",
        null,
        "Report not found"
      );
    }
    // Invalidate the cache for the updated report
    //will delete a cache with the given id
    delCacheByPrefix(cacheKey.reportById(id));
    return sendResponse(
      res,
      200,
      true,
      "Report status updated successfully",
      updatedReport,
      "Report status updated successfully"
    );
  } catch (error) {
    console.error("Error updating report status:", error);
    return sendResponse(res, 500, false, "Error updating report status");
  }
}

async function nearIncidents(req, res) {
  try {
    console.log("getting near incidents...");
    const [lat, lng] = req.query.near.split(",").map(parseFloat);
    if (!lat || !lng) {
      return sendResponse(
        res,
        400,
        false,
        "Coordinates not provided",
        null,
        "Coordinates not provided"
      );
    }
    let timePeriod = req.query.timePeriod || 48 * 60 * 60 * 1000; // default to 48 hours
    timePeriod = new Date(Date.now() - timePeriod);
    const nearInc = await getNearIncidents(lat, lng, timePeriod);
    if (!nearInc || nearInc.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "No recent incidents in 1km radius",
        null,
        "No recent incidents in 1km radius"
      );
    }
    return sendResponse(
      res,
      200,
      true,
      "Found incidents in 1km radius",
      nearInc,
      null
    );
  } catch (error) {
    console.log("error in getting near reports");
    return sendResponse(res, 500, false, "Error getting near reports");
  }
}

async function getReportById(req, res) {
  try {
    console.log("getting report by id...");
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(
        res,
        400,
        false,
        "Report ID is required",
        null,
        "Report ID is required"
      );
    }

    // Check if the report is in the cache
    const report = await getOrSetCache(
      cacheKey.reportById(id),
      async () => {
        const report = await reportById(id);
        return report;
      },
      5 * 60 // Cache for 5 minutes
    );

    if (!report) {
      return sendResponse(
        res,
        404,
        false,
        "Report not found",
        null,
        "Report not found"
      );
    }
    return sendResponse(
      res,
      200,
      true,
      "Report retrieved successfully",
      report,
      "Report retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting report:", error);
    return sendResponse(res, 500, false, "Error getting report");
  }
}

module.exports = {
  reportIncident,
  getReports,
  deleteReport,
  updateReportStatus,
  nearIncidents,
  getNearIncidents,
  getReportById,
};
