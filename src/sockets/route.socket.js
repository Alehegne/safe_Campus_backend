const { sendResponse } = require("../utils/sendResponse");
const Route = require("../models/route.model");

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxUpdates: 60 // Maximum 60 updates per minute
};

// Store for rate limiting
const updateCounts = new Map();

function initRouteSocket(routeNamespace) {
  // Handle route room management
  routeNamespace.on("connection", (socket) => {
    console.log('New route socket connection:', {
      socketId: socket.id,
      user: socket.user
    });

    // Join route room
    socket.on("route:join", async (routeId) => {
      console.log('Attempting to join route:', {
        routeId,
        socketId: socket.id,
        user: socket.user
      });

      try {
        const route = await Route.findById(routeId);
        if (!route) {
          console.log('Route not found:', routeId);
          return socket.emit("error", { message: "Route not found" });
        }
        
        console.log('Found route:', {
          routeId: route._id,
          userId: route.userId,
          socketUserId: socket.user?.userId
        });

        // Check if user has permission to join
        if (route.userId.toString() !== socket.user?.userId) {
          console.log('Unauthorized join attempt:', {
            routeUserId: route.userId.toString(),
            socketUserId: socket.user?.userId
          });
          return socket.emit("error", { message: "Unauthorized to join this route" });
        }
        
        socket.join(`route:${routeId}`);
        console.log('Successfully joined route room:', {
          routeId,
          socketId: socket.id
        });
        socket.emit("route:joined", { routeId });
      } catch (error) {
        console.error(`Error joining route room: ${error.message}`, {
          error,
          routeId,
          socketId: socket.id,
          user: socket.user
        });
        socket.emit("error", { message: "Failed to join route room" });
      }
    });

    // Leave route room
    socket.on("route:leave", (routeId) => {
      socket.leave(`route:${routeId}`);
      socket.emit("route:left", { routeId });
    });

    // Handle location updates with rate limiting
    socket.on("route:location-update", async (data) => {
      try {
        const { routeId, location } = data;
        
        // Validate input
        if (!routeId || !location || !location.coordinates) {
          return socket.emit("error", { message: "Invalid location update data" });
        }

        // Check rate limit
        const now = Date.now();
        const userUpdates = updateCounts.get(socket.user.userId) || [];
        const recentUpdates = userUpdates.filter(time => now - time < RATE_LIMIT.windowMs);
        
        if (recentUpdates.length >= RATE_LIMIT.maxUpdates) {
          return socket.emit("error", { message: "Too many location updates" });
        }

        // Update rate limit counter
        recentUpdates.push(now);
        updateCounts.set(socket.user.userId, recentUpdates);

        // Update route location
        const route = await Route.findById(routeId);
        if (!route) {
          return socket.emit("error", { message: "Route not found" });
        }

        if (route.userId.toString() !== socket.user.userId) {
          return socket.emit("error", { message: "Unauthorized to update this route" });
        }

        route.locationPoints.push({
          location: {
            type: "Point",
            coordinates: location.coordinates
          },
          timestamp: new Date()
        });

        await route.save();

        // Broadcast update to all clients in the route room
        routeNamespace.to(`route:${routeId}`).emit("route:location-updated", {
          routeId,
          location: route.locationPoints[route.locationPoints.length - 1]
        });
      } catch (error) {
        console.error(`Error updating route location: ${error.message}`);
        socket.emit("error", { message: "Failed to update route location" });
      }
    });

    // Handle route sharing
    socket.on("route:share", async (data) => {
      try {
        const { routeId, sharedWith } = data;
        
        if (!routeId || !sharedWith) {
          return socket.emit("error", { message: "Invalid share data" });
        }

        const route = await Route.findById(routeId);
        if (!route) {
          return socket.emit("error", { message: "Route not found" });
        }

        if (route.userId.toString() !== socket.user.userId) {
          return socket.emit("error", { message: "Unauthorized to share this route" });
        }

        route.sharedWith.push(sharedWith);
        await route.save();

        // Notify the shared user
        routeNamespace.to(`user:${sharedWith}`).emit("route:shared", {
          routeId,
          sharedBy: socket.user.userId
        });

        socket.emit("route:shared-success", { routeId, sharedWith });
      } catch (error) {
        console.error(`Error sharing route: ${error.message}`);
        socket.emit("error", { message: "Failed to share route" });
      }
    });

    // Handle route status changes
    socket.on("route:status-change", async (data) => {
      try {
        const { routeId, status } = data;
        
        if (!routeId || !status) {
          return socket.emit("error", { message: "Invalid status change data" });
        }

        const route = await Route.findById(routeId);
        if (!route) {
          return socket.emit("error", { message: "Route not found" });
        }

        if (route.userId.toString() !== socket.user.userId) {
          return socket.emit("error", { message: "Unauthorized to change route status" });
        }

        route.status = status;
        await route.save();

        // Broadcast status change to all clients in the route room
        routeNamespace.to(`route:${routeId}`).emit("route:status-changed", {
          routeId,
          status
        });

        socket.emit("route:status-changed-success", { routeId, status });
      } catch (error) {
        console.error(`Error changing route status: ${error.message}`);
        socket.emit("error", { message: "Failed to change route status" });
      }
    });
  });
}

module.exports = initRouteSocket; 