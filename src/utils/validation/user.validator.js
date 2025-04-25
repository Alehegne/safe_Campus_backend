const Joi = require("joi");

function validateUser(userData) {
  const userSchema = Joi.object({
    studentId: Joi.string().optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    fullName: Joi.string().optional(),
    role: Joi.string()
      .valid("student", "admin", "campus_security")
      .default("student"),
    trustedContacts: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().optional(),
          phone: Joi.string().optional(),
          email: Joi.string().email().optional(),
          relationShip: Joi.string()
            .valid("friend", "roommate", "colleague", "other")
            .default("friend"),
        })
      )
      .optional(),
    location: Joi.object({
      type: Joi.string().valid("Point").required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required(), // [longitude, latitude]
    }).optional(),
    addressDescription: Joi.string().optional(), // like Dorm1, Dorm2, etc.
  });
  try {
    userSchema.validate(userData, { abortEarly: false });
    return {
      success: true,
      message: "Validation successful",
    };
  } catch (error) {
    return {
      success: false,
      message: error.details[0].message,
    };
  }
}

function validateUpdateUser(userData) {
  const userSchema = Joi.object({
    studentId: Joi.string().optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    fullName: Joi.string().optional(),
    trustedContacts: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().optional(),
          phone: Joi.string().optional(),
          email: Joi.string().email().optional(),
          relationShip: Joi.string()
            .valid("friend", "roommate", "colleague", "other")
            .default("friend"),
        })
      )
      .optional(),
    location: Joi.object({
      type: Joi.string().valid("Point").required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required(), // [longitude, latitude]
    }).optional(),
    addressDescription: Joi.string().optional(), // like Dorm1, Dorm2, etc.
  });
  try {
    userSchema.validate(userData, { abortEarly: false });
    return {
      success: true,
      message: "Validation successful",
    };
  } catch (error) {
    return {
      success: false,
      message: error.details[0].message,
    };
  }
}

module.exports = {
  validateUser,
  validateUpdateUser,
};
