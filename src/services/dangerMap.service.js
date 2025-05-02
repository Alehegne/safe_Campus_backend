const dangerMap = require("../models/dangerArea.model");
/*
    * find the report location from dangeMap, with in 100m radius.
    * if found increase the count
    * if not, create a new dangerMap

*/
async function saveDangerMap(data) {
  try {
    console.log("saving danger map:", data);
    const maxd = 100;
    const coordinates = data.location.coordinates;
    //find existi ng danger near 100m , and update reportCount
    const existing = await dangerMap
      .find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: coordinates,
            },
            $maxDistance: maxd,
          },
        },
      })
      .limit(1); // to get the nearest danger map

    if (existing && existing.length > 0) {
      console.log("updating existing dangerous area::");
      //updating the reportCount
      existing[0].reportCount += 1;
      //marking the severity
      existing[0].severiry =
        existing[0].reportCount >= 3
          ? "high"
          : existing[0].reportCount >= 2
          ? "medium"
          : "low";
      //updating other fields
      if (!existing[0].types.includes(data.types)) {
        existing[0].types.push(data.types);
      }
      if (!existing[0].source.includes(data.source)) {
        existing[0].source.push(data.source);
      }
      if (!existing[0].reports.includes(data.reportId)) {
        existing[0].reports.push(data.reportId);
      }

      //update the other field
      existing[0].reportCount += 1;
      existing[0].lastReportedAt = data.lastReportedAt;
      //save the updated danger map
      await existing[0].save();
      console.log("existing danger map updated:", existing);
      return {
        success: true,
        message: "zone updated",
        data: existing,
      };
    }
    //if not found, create a new dangerMap
    console.log("creating new danger map:", data);
    const newDangerMap = new dangerMap({
      location: {
        type: "Point",
        coordinates: coordinates,
      },
      severity: data.severity,
      reportCount: data.reportCount,
      source: data.source,
      status: data.status,
      types: data.types,
      reports: data.reportId,
      lastReportedAt: Date.now(),
    });
    const savedDangerMap = await newDangerMap.save();
    console.log("new danger map created:", savedDangerMap);
    return {
      success: true,
      message: "zone created",
      data: savedDangerMap,
    };
  } catch (error) {
    console.error("Error fetching dangerous areas:", error);
    throw error;
  }
}

async function getDangerService(query) {
  try {
    const { page = 1, limit = 15, ...filters } = query;
    const skip = (page - 1) * limit;
    const filter = {
      ...(filters.status && { status: filters.status }),
      ...(filters.types && { types: { $in: filters.types.split(",") } }),
      ...(filters.severity && { severiry: filters.severiry }),
      ...(filters.source && { source: { $in: filters.source.split(",") } }),
    };

    const dangerousAreas = await dangerMap
      .find(filter)
      .sort({ lastReportedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reports", "-__v -createdAt -updatedAt");
    return dangerousAreas;
  } catch (error) {
    console.error("Error fetching dangerous areas:", error);
    throw new Error("Error fetching dangerous areas");
  }
}
async function saveRiskZone(data) {
  try {
    const savedRisk = new dangerMap(data);
    await savedRisk.save();
    return savedRisk;
  } catch (error) {
    console.error("Error in saving risk zone", error);
    throw new Error("Error in saving risk zone");
  }
}

async function deleteDangerArea(id) {
  const deleted = await dangerMap.findByIdAndDelete(id);
  return deleted;
}

module.exports = {
  saveDangerMap,
  getDangerService,
  saveRiskZone,
};
