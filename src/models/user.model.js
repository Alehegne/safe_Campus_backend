const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      //not requred for admin and campus_security
      validate: {
        validator: function (v) {
          return this.role !== "student" || (v && v.trim().length > 0); //check if studentId is not empty
        },
        message: "Student ID is required for students",
      },
    },
    deviceToken: {
      // for push notifications using firebase cloud messaging
      type: String,
      trim: true,
      required: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "admin", "campus_security"],
      default: "student",
    },
    trustedContacts: [
      {
        name: {
          type: String,
        },
        phone: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        relationShip: {
          type: String,
          enum: ["friend", "roommate", "colleague", "other"],
          default: "friend",
        },
      },
    ],
    location: {
      //
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        //[longitude, latitude]
        type: [Number],
        required: true,
      },
    },
    addressDescription: {
      type: String, //like Dorm1, Dorm2, etc.
      trim: true,
    },
  },
  { timestamps: true }
);

// GeoJSON index for location-based queries
userSchema.index({ location: "2dsphere" });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model("User", userSchema);
