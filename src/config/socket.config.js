/*
# initialize socket.io server
# then expose the io instance to be used in other file,
#and initialize socket events
*/

const { Server } = require("socket.io");
const initSocketEvents = require("../sockets/index");

let ioInstance;

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.ALLOWEDORIGINS
          : "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    },
  });
  io.on("connection", (socket) => {
    console.log("a client connected, client id:", socket.id);
    // Middleware for specific event
    // socket.use((packet, next) => {
    //   console.log("packet:", packet);
    //   if (packet[0] === "message") {
    //     const message = packet[1];
    //     if (message.length < 5) {
    //       return next(new Error("Message too short!"));
    //     }
    //   }
    //   next();
    // });
    // socket.emit("welcome", "welcome to the socket server");
    // socket.on("message", (data) => {
    //   console.log("message from client", data);
    //   socket.broadcast.emit("new-message", data);
    // });
    socket.on("disconnect", () => {
      console.log("client disconnected", socket.id);
    });
  });

  // Initialize socket events
  initSocketEvents(io);

  ioInstance = io;
}
function getIO() {
  if (!ioInstance) throw new Error("Socket not initialized");
  return ioInstance;
}

module.exports = { initSocket, getIO };
