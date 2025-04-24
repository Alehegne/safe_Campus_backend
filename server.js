const app = require("./src/app");
const connectToDatabase = require("./src/config/dbConnection");
require("dotenv").config();
const cors = require("cors"); //
const { createServer } = require("http");
const { Server } = require("socket.io"); //importing socket.io
const getSocketConfig = require("./src/config/socket.config");
const getCorsConfig = require("./src/config/cors.config"); //importing cors config
const initSocket = require("./src/sockets/index"); //importing socket.io config

app.use(cors(getCorsConfig())); //using cors middleware with the config

//http server, passing the express app to it, so it can handle requests
const server = createServer(app);
//initializing socket.io server, passing the http server to it
connectToDatabase(); //connecting to the database
const io = new Server(server, getSocketConfig());

// Connection-level middleware
// io.use((socket, next) => {
//   console.log("socket handShake:", socket.handshake); // Log the handshake object for debugging
//   const token = socket.handshake.query.token; // Get token from handshake
//   console.log("token:", token); // Log the token for debugging
//   if (token === "1234567890") {
//     return next(); // Allow connection
//   }
//   console.log("error:");
//   return next(new Error("Authentication failed")); // Reject connection
// });

//initializing socket.io with the server
initSocket(io); //initializing socket.io with the server

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
