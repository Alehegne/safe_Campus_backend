const { default: mongoose } = require("mongoose");

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw new Error(error);
  }
}

module.exports = connectToDatabase;
