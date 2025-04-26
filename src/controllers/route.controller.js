const Route = require("../models/route.model");
const sendResponse = require("../utils/sendResponse");

// Start a new route
async function startRoute(req, res) {
  try {
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }

    const { startLocation, description } = req.body;
    if (!startLocation || !startLocation.coordinates) {
      return sendResponse(res, 400, false, "Start location is required", null);
    }

    const newRoute = new Route({
      userId: user.userId,
      startLocation: {
        type: "Point",
        coordinates: startLocation.coordinates,
        timestamp: new Date()
      },
      description,
      status: "started",
      locationPoints: [{
        type: "Point",
        coordinates: startLocation.coordinates,
        timestamp: new Date()
      }]
    });

    await newRoute.save();
    sendResponse(res, 201, true, "Route started successfully", newRoute);
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

// Stop a route
async function stopRoute(req, res) {
  try {
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }

    const { routeId } = req.params;
    const { endLocation } = req.body;

    const route = await Route.findOne({ _id: routeId, userId: user.userId });
    if (!route) {
      return sendResponse(res, 404, false, "Route not found", null);
    }

    if (route.status === "ended") {
      return sendResponse(res, 400, false, "Route is already ended", null);
    }

    route.status = "ended";
    route.endTime = new Date();
    
    if (endLocation && endLocation.coordinates) {
      route.endLocation = {
        type: "Point",
        coordinates: endLocation.coordinates,
        timestamp: new Date()
      };
      route.locationPoints.push({
        type: "Point",
        coordinates: endLocation.coordinates,
        timestamp: new Date()
      });
    }

    await route.save();
    sendResponse(res, 200, true, "Route ended successfully", route);
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

// Update route location
async function updateRouteLocation(req, res) {
  try {
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }

    const { routeId } = req.params;
    const { coordinates } = req.body;

    if (!coordinates) {
      return sendResponse(res, 400, false, "Location coordinates are required", null);
    }

    const route = await Route.findOne({ _id: routeId, userId: user.userId });
    if (!route) {
      return sendResponse(res, 404, false, "Route not found", null);
    }

    if (route.status === "ended") {
      return sendResponse(res, 400, false, "Cannot update location of ended route", null);
    }

    const locationPoint = {
      type: "Point",
      coordinates,
      timestamp: new Date()
    };

    route.locationPoints.push(locationPoint);
    await route.save();

    sendResponse(res, 200, true, "Route location updated successfully", { locationPoint });
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

// Get route status
async function getRouteStatus(req, res) {
  try {
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }

    const { routeId } = req.params;
    const route = await Route.findOne({ _id: routeId, userId: user.userId });
    
    if (!route) {
      return sendResponse(res, 404, false, "Route not found", null);
    }

    sendResponse(res, 200, true, "Route status retrieved successfully", {
      status: route.status,
      startTime: route.startTime,
      endTime: route.endTime,
      currentLocation: route.locationPoints[route.locationPoints.length - 1]
    });
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

// Share route with friends
async function shareRoute(req, res) {
  try {
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }

    const { routeId } = req.params;
    const { friendIds } = req.body;

    if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
      return sendResponse(res, 400, false, "Friend IDs are required", null);
    }

    const route = await Route.findOne({ _id: routeId, userId: user.userId });
    if (!route) {
      return sendResponse(res, 404, false, "Route not found", null);
    }

    // Add new friends to sharedWith array
    const newFriends = friendIds.filter(friendId => 
      !route.sharedWith.some(share => share.userId.toString() === friendId)
    );

    if (newFriends.length === 0) {
      return sendResponse(res, 400, false, "Route is already shared with these friends", null);
    }

    route.sharedWith.push(...newFriends.map(friendId => ({
      userId: friendId,
      sharedAt: new Date()
    })));

    await route.save();
    sendResponse(res, 200, true, "Route shared successfully", { sharedWith: route.sharedWith });
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

// Get shared route
async function getSharedRoute(req, res) {
  try {
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }

    const { routeId } = req.params;
    const route = await Route.findOne({
      _id: routeId,
      "sharedWith.userId": user.userId
    });

    if (!route) {
      return sendResponse(res, 404, false, "Route not found or not shared with you", null);
    }

    sendResponse(res, 200, true, "Shared route retrieved successfully", route);
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

module.exports = {
  startRoute,
  stopRoute,
  updateRouteLocation,
  getRouteStatus,
  shareRoute,
  getSharedRoute
}; 