const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (v) {
            return (
              v.length === 2 &&
              typeof v[0] === "number" &&
              typeof v[1] === "number"
            );
          },
          message:
            "Coordinates must be an array of two numbers [longitude, latitude]",
        },
      },
    },
    anonymous: { type: Boolean, default: false },
    evidenceImage: String,
    reportedAt: { type: Date, default: Date.now },
    tags: {
      type: String,
      enum: [
        "theft",
        "assault",
        "vandalism",
        "harassment",
        "other",
        "accident",
        "fire",
        "flood",
        "earthquake",

        "storm",
      ],
      default: "other",
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);
incidentSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("Incidents", incidentSchema);
