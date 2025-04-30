const mongoose = require("mongoose");

// Pure GeoJSON Point schema without metadata
const geoJSONPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
    default: "Point"
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 2 && 
               typeof v[0] === "number" && 
               typeof v[1] === "number";
      },
      message: "Coordinates must be an array of two numbers [longitude, latitude]"
    }
  }
}, { _id: false });  // Disable _id generation for GeoJSON objects

// Location point with timestamp (for locationPoints array)
const trackedPointSchema = new mongoose.Schema({
  location: {
    type: geoJSONPointSchema,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const routeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startLocation: {
      type: geoJSONPointSchema,
      required: true
    },
    endLocation: {
      type: geoJSONPointSchema,
      required: false
    },
    status: {
      type: String,
      enum: ["started", "paused", "ended", "emergency"],
      default: "started"
    },
    locationPoints: [trackedPointSchema],
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

// GeoJSON indexes for location-based queries
routeSchema.index({ "startLocation": "2dsphere" });
routeSchema.index({ "endLocation": "2dsphere" });
routeSchema.index({ "locationPoints.location": "2dsphere" });

// Index for user's route history
routeSchema.index({ userId: 1, startTime: -1 });

module.exports = mongoose.model("Route", routeSchema);