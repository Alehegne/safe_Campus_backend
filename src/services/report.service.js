const incidentModel = require("../models/incidentModel");

async function saveReport(incidentData) {
  try {
    const incident = await incidentModel.create(incidentData);
    await incident.populate("reporterId", "fullName email studentId role");
    return incident;
  } catch (error) {
    console.error("Error saving report:", error);
    throw new Error("Error saving report");
  }
}
async function reportByUser(query) {
  try {
    const reports = await incidentModel.find(query);
    return reports;
  } catch (error) {
    console.error("Error getting report by user:", error);
    throw new Error("Error getting report by user");
  }
}

async function getReportService(query) {
  try {
    const { page = 1, limit = 15 } = query;
    const skip = (page - 1) * limit;
    const queries = {};
    if (query.status) {
      queries.status = query.status;
    }
    if (query.reporterId) {
      queries.reporterId = query.reporterId;
    }
    if (query.tags) {
      queries.tags = { $in: query.tags.split(",") };
    }

    // console.log("Queries:", queries);

    const reports = await incidentModel
      .find(queries)
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(limit);

    //populate for non anonymous users
    const populatedReports = await Promise.all(
      reports.map(async (report) => {
        if (!report.anonymous) {
          await report.populate("reporterId", "fullName email studentId");
        }
        return report;
      })
    );

    const totalReports = await incidentModel.countDocuments(queries);
    const totalPages = Math.ceil(totalReports / limit);
    const analysis = {
      totalReports,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      reports: populatedReports,
      analysis,
    };
  } catch (error) {
    console.error("Error getting reports:", error);
    throw new Error("Error getting reports");
  }
}

async function deleteReportService(id) {
  try {
    const report = await incidentModel.findByIdAndDelete(id);
    return report;
  } catch (error) {
    console.error("Error deleting report:", error);
    throw new Error("Error deleting report");
  }
}

async function updateStatus(id, status) {
  try {
    const report = await incidentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    return report;
  } catch (error) {
    console.error("Error updating status:", error);
    throw new Error("Error updating status");
  }
}

async function getNearIncidents(lat, lng, timePeriod) {
  try {
    const incidents = await incidentModel.find({
      reportedAt: { $gte: timePeriod },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: 1000,
        },
      },
    });
    return incidents;
  } catch (error) {
    console.error("Error getting near incidents:", error);
    throw new Error("Error getting near incidents");
  }
}
async function reportById(id) {
  try {
    const report = await incidentModel.findById(id);
    return report;
  } catch (error) {
    console.error("Error getting report by ID:", error);
    throw new Error("Error getting report by ID");
  }
}

module.exports = {
  saveReport,
  getReportService,
  deleteReportService,
  updateStatus,
  getNearIncidents,
  reportById,
  reportByUser,
};
