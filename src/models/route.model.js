const mongoose = require("mongoose");

const locationPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
    default: "Point"
  },
  coordinates: {
    type: [Number], //[longitude, latitude]
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const routeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startLocation: {
      type: locationPointSchema,
      required: true
    },
    endLocation: {
      type: locationPointSchema,
      required: false // Not required initially as user might not know end location
    },
    status: {
      type: String,
      enum: ["started", "paused", "ended", "emergency"],
      default: "started"
    },
    locationPoints: [locationPointSchema],
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }],
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Index for geospatial queries on start and end locations
routeSchema.index({ "startLocation": "2dsphere" });
routeSchema.index({ "endLocation": "2dsphere" });
routeSchema.index({ "locationPoints": "2dsphere" });

// Index for querying routes by user
routeSchema.index({ userId: 1, startTime: -1 });

module.exports = mongoose.model("Route", routeSchema); 