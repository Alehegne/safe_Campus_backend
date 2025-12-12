const { default: mongoose } = require("mongoose");

const dangerAreaSchema = new mongoose.Schema(
  {
    zoneName: {
      type: String,
      required: false,
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
        validate: {
          validator: function (value) {
            return value.length === 2 && !isNaN(value[0]) && !isNaN(value[1]);
          },
          message:
            "Coordinates must be an array of two numbers [longitude, latitude]",
        },
      },
    },
    severiry: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    reportCount: {
      type: Number,
      default: 1,
    },
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incidents",
      },
    ],
    //source of the report, user, admin, campus_security, anonymous, other
    source: [
      {
        type: String,
        enum: ["user", "admin", "campus_security", "anonymous", "other"],
        default: "user",
      },
    ],
    status: {
      type: String,
      enum: ["active", "under investigation", "resolved"],
      default: "active",
    },
    types: [
      // type of the report, theft, assault, vandalism, harassment, other
      {
        type: String,
        default: "other",
      },
    ],
    lastReportedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

dangerAreaSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("DangerArea", dangerAreaSchema);
