const PanicEvent = require("../models/panicEvent.model");
const socketAuth = require("./middleware/socket.auth");

module.exports = function initSosSocket(io) {
  const ns = io.of("/location_updates");

  //auth middleware
  ns.use(socketAuth);
  ns.on("connection", (socket) => {
    console.log("Authenticating socket...:", socket.user);
    const { userId, role } = socket.user;

    console.log("Socket connected:", socket.id, role);

    /* ================= ADMIN ================= */
    if (role === "admin") {
      socket.join("admins");
      console.log("Admin joined admins room");
    }

    /* ================= USER (OLD join_channel) ================= */
    socket.on("join_channel", async ({ channelId }) => {
      // channelId === panicId
      // const panic = await PanicEvent.findById(channelId);
      // if (!panic || panic.status !== "active") return;

      // socket.data.panicId = channelId;
      socket.join(`panic:${channelId}`);

      console.log(`User joined panic:${channelId}`);
    });

    /* ================= USER (OPTIONAL NEW API) ================= */
    socket.on("join_panic", async ({ panicId }) => {
      const panic = await PanicEvent.findById(panicId);
      console.log("Panic event fetched for joining:", panicId, panic);
      if (!panic || panic.status !== "active") return;

      socket.data.panicId = panicId;
      socket.join(`panic:${panicId}`);
    });

    /* ============ LOCATION UPDATE (OLD FORMAT) ============ */
    socket.on("update_location", async ({ channelId, location }) => {
      try {
        console.log("Received location update:", { channelId, location });
        const panicId = socket.data.panicId || channelId;
        console.log("panic id:", panicId);
        if (!panicId) return;
        console.log(
          "type of :",
          typeof location.latitude,
          typeof location.longitude
        );
        if (
          !location ||
          typeof location.latitude !== "number" ||
          typeof location.longitude !== "number" ||
          Number.isNaN(location.latitude) ||
          Number.isNaN(location.longitude)
        ) {
          return;
        }

        const { latitude, longitude } = location;

        //emit location updates for each panicId to admins
        ns.to("admins").emit(`panic:${panicId}`, {
          _id: panicId,
          userId,
          location,
          updatedAt: Date.now(),
        });

        // Update DB (last known location)
        await PanicEvent.findByIdAndUpdate(
          { _id: panicId },
          {
            $set: {
              location: {
                type: "Point",
                coordinates: [location.longitude, location.latitude],
              },
            },
          },
          { new: true }
        );
        console.log("Panic event location updated in DB");
      } catch (err) {
        console.error("Error updating panic event location:", err);
      }

      // Emit to admins
      ns.to("admins").emit("location_update", {
        _id: socket.data.panicId,
        userId,
        location,
        updatedAt: Date.now(),
      });

      // Optional: emit back to panic room (if you still need it)
      ns.to(`panic:${socket.data.panicId}`).emit("location_update", {
        userId,
        location,
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
