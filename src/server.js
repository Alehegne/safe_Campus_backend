const app = require("./app");
const { initSocket } = require("./config/socket.config");
const { connectToDatabase } = require("./config/dbConnection");
const Route = require("./models/route.model");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectToDatabase();
    console.log("Database connected successfully");

    await Route.init();
    console.log("Route model indexes initialized");

    const server = require('http').createServer(app);

    try {
      initSocket(server);
      console.log("Socket.io server initialized successfully");
    } catch (socketError) {
      console.error("Failed to initialize Socket.io:", socketError);
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer(); 