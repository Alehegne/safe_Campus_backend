const { default: mongoose } = require("mongoose");

const panicEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  notifications: [
    {
      type: {
        type: String,
        enum: ["contact", "guard"],
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // For guards (registered users)
      },
      name: String,
      email: String,
      notifiedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  acknowledgedBy: [
    // to show the user who is on the way to help
    {
      responder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      email: {
        type: String,
      },
      name: {
        type: String,
      },
      notifiedAt: {
        type: Date,
        default: Date.now,
      },
      response: {
        type: String,
        enum: ["yes", "no"],
        default: null,
      },
    },
  ],

  timeStamp: {
    type: Date,
    default: Date.now,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolvedAt: {
    type: Date,
  },
});

panicEventSchema.index({ location: "2dsphere" }); // Create a 2dsphere index for geospatial queries
const PanicEvent = mongoose.model("PanicEvent", panicEventSchema);
module.exports = PanicEvent;
