require("dotenv").config();
const app = require("./src/app");
const { createServer } = require("http");
const connectToDatabase = require("./src/config/dbConnection");
const { initSocket } = require("./src/config/socket.config");

//configure app

connectToDatabase();
//create server AFTER app is fully configured
const server = createServer(app);
// const server_8000 = createServer(app);
initSocket(server);
// initSocket(server_8000);
const PORT = process.env.PORT;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));
// server_8000.listen(8000, () => console.log(` Server running on port 8000`));
