require("dotenv").config();
const app = require("./src/app");
const { createServer } = require("http");
const connectToDatabase = require("./src/config/dbConnection");
const { initSocket } = require("./src/config/socket.config");
const cors = require("cors");
const getCorsConfig = require("./src/config/cors.config");
//configure app
app.use(cors(getCorsConfig()));
connectToDatabase();
// Step 2: create server AFTER app is fully configured
const server = createServer(app);
initSocket(server);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));


