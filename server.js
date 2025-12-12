require("dotenv").config();
const app = require("./src/app");
const { createServer } = require("http");
const connectToDatabase = require("./src/config/dbConnection");
const { initSocket } = require("./src/config/socket.config");

//configure app

connectToDatabase();
//create server AFTER app is fully configured
const server = createServer(app);
initSocket(server);
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));
