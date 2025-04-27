const sendResponse = require("../utils/sendResponse");
const { sendPanic, savePanicEvent } = require("../services/panicAlert.service");
const { decodeToken, getGoogleMapURL } = require("../utils/helper");
const PanicEvent = require("../models/panicEvent.model");
async function triggerPanicEvent(req, res) {
  try {
    const { user } = req;
    if (!req.body || req.body.length === 0) {
      return sendResponse(res, 401, false, "invalid request!");
    }
    const { location } = req.body;
    if (!location || !Array.isArray(location.coordinates)) {
      return sendResponse(
        res,
        401,
        "provide location with coordinates!(longitude,latitude)"
      );
    }
    //TODO: add address name from geocoding API
    //save the panic event before sending, since we need the eventId to send to the user

    const panicEvent = {
      userId: user.userId,
      location: {
        type: "Point",
        coordinates: location.coordinates,
      },
    };
    const newPanicEvent = await savePanicEvent(panicEvent);
    if (!newPanicEvent) {
      return sendResponse(res, 401, false, "failed to save panic event!");
    }
    await sendPanic(user.userId, location, newPanicEvent._id);
    //save the panic event to the database

    console.log("new event created:", newPanicEvent);
    sendResponse(res, 200, true, "success", {
      message: "Panic event triggered successfully.",
      data: newPanicEvent,
    });
  } catch (error) {
    console.error("Error triggering panic event:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}
async function getAllPanicEvents(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const panicEvents = await PanicEvent.find()
      .populate("userId", "name email")
      .populate("resolvedBy", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalPanicEvents = await PanicEvent.countDocuments();
    const totalPages = Math.ceil(totalPanicEvents / limit);
    const analysis = {
      totalPanicEvents,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return sendResponse(res, 200, true, "success", {
      message: "Panic events retrieved successfully.",
      data: panicEvents,
      analysis: analysis,
    });
  } catch (error) {
    console.error("Error getting all panic events:", error);
    return sendResponse(res, 500, false, "Internal server error!");
  }
}
async function getAllPanicByUserId(req, res) {
  try {
    const { user } = req;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const panicEvents = await PanicEvent.find({ userId: user.userId })
      .populate("userId", "name email")
      .populate("resolvedBy", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalPanicEvents = await PanicEvent.countDocuments({
      userId: user.userId,
    });
    const totalPages = Math.ceil(totalPanicEvents / limit);
    const analysis = {
      totalPanicEvents,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
    return sendResponse(res, 200, true, "success", {
      message: "Panic events retrieved successfully.",
      data: panicEvents,
      analysis: analysis,
    });
  } catch (error) {
    console.error("Error getting all panic events:", error);
    return sendResponse(res, 500, false, "Internal server error!");
  }
}
async function responseHandler(req, res) {
  try {
    console.log("response handler called!");
    const token = req.query.token;
    const secret = process.env.RESPONSE_TOKEN_SECRET;
    const decodedToken = decodeToken(token, secret);

    if (!decodedToken || decodedToken.type !== "response") {
      return sendResponse(res, 401, false, "invalid token!");
    }
    console.log("decoded token:", decodedToken);
    const { email, response, eventId, role } = decodedToken;
    if (!email || !response || !eventId || !role) {
      return res.redirect(process.env.GMAIL_REDIRECT_URL);
    }
    //update the panic event with the response
    const updated = {
      acknowledgedBy: {
        userId: decodedToken?.userId,
        notifiedAt: new Date(),
        response: response,
        name: decodedToken.name,
        email: decodedToken?.email,
      },
    };

    const updatedPanicEvent = await PanicEvent.findOneAndUpdate(
      {
        _id: eventId,
        acknowledgedBy: {
          $not: {
            $elemMatch: { email: decodedToken?.email, response: response },
          },
        },
      },
      { $push: updated },
      { new: true }
    );
    console.log("fine:");
    console.log("updated panic event:", updatedPanicEvent);
    let panicEventData = updatedPanicEvent;
    if (!updatedPanicEvent) {
      panicEventData = await PanicEvent.findById(eventId);
      if (!panicEventData) {
        return res.redirect(process.env.GMAIL_REDIRECT_URL);
      }
    }

    const mapUrl = getGoogleMapURL(
      panicEventData.location.coordinates[1],
      panicEventData.location.coordinates[0]
    );
    console.log("updated panic event:", updatedPanicEvent);
    //if the req is from gmail, redirect
    res.redirect(
      `${process.env.GMAIL_REDIRECT_URL}?response=${response}&victim=${decodedToken.name}$mapUrl=${mapUrl}`
    );
  } catch (error) {
    console.error("Error handling response:", error);
    return sendResponse(res, 500, false, "Internal server error!");
  }
}

async function emailViewTracker(req, res) {
  try {
    console.log("email view tracker called!");
    const token = req.query.token;
    const secret = process.env.TRACKING_TOKEN_SECRET;
    const decodeToken = decodeToken(token, secret);
    console.log("decoded token:", decodeToken);
    if (!decodeToken || decodeToken.type !== "emailOpen") {
      return res.send("invalid tracking link!");
    }
    const { eventId, role = "contact" } = decodeToken;
    if (!eventId || !role) {
      return res.send("invalid tracking link!");
    }

    //update the panic notification with the response
    const updated = {
      notifications: {
        type: role,
        name: decodeToken?.name,
        email: decodeToken?.email,
        notifiedAt: new Date(),
      },
    };

    //update the panic event with the response
    const updatedPanicEvent = await PanicEvent.findOneAndUpdate(
      {
        _id: eventId,
        notifications: {
          $not: {
            $elemMatch: { email: decodeToken?.email, type: role },
          },
        },
      },
      { $push: updated },
      { new: true }
    );

    if (!updatedPanicEvent) {
      return res.send("invalid tracking link!");
    }
    console.log("updated panic event:", updatedPanicEvent);
    //send the response to the image href
    const img = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/gbLbfsAAAAASUVORK5CYII=",
      "base64"
    );
    res.set("Content-Type", "image/png");
    res.send(img);
  } catch (error) {
    console.error("Error updating notified contacts:", error);
    return res.status(500).send("invalid tracking link!");
  }
}

async function resolvedPanicEvent(req, res) {
  try {
    const { eventId } = req.params;
    const { user } = req;
    if (!eventId) {
      return sendResponse(res, 401, false, "invalid request!");
    }
    //toggle the resolved status of the panic event,
    //and update the resolvedBy field with the userId of the user who resolved it

    const panicEvent = await PanicEvent.findById(eventId);
    if (!panicEvent) {
      return sendResponse(res, 401, false, "panic event not found!");
    }
    panicEvent.resolved = !panicEvent.resolved;
    panicEvent.resolvedBy = user.userId;
    panicEvent.resolvedAt = new Date();
    await panicEvent.save();
    const updatedPanicEvent = await PanicEvent.findById(eventId).populate(
      "resolvedBy",
      "name email"
    );
    console.log("updated panic event:", updatedPanicEvent);

    console.log("updated panic event:", updatedPanicEvent);
    sendResponse(res, 200, true, "success", {
      message: "Panic event resolved successfully.",
      data: updatedPanicEvent,
    });
  } catch (error) {
    console.error("Error updating resolved panic event:", error);
    return sendResponse(
      res,
      500,
      false,
      "Internal server error!",
      error.message
    );
  }
}
async function updateNotifiedContacts(req, res) {
  try {
    const { eventId } = req.params;
    const { user } = req;
    if (!eventId) {
      return sendResponse(res, 401, false, "invalid request!");
    }
    //update the notifed contacts
    const updated = {
      notifications: {
        type: user.role,
        userId: user.userId,
      },
    };
    const updatedPanicEvent = await PanicEvent.findOneAndUpdate(
      {
        _id: eventId,
        notifications: {
          $not: {
            $elemMatch: { userId: user.userId },
          },
        },
      },
      { $push: updated },
      { new: true }
    );
    let panicEventData = updatedPanicEvent;
    if (!updatedPanicEvent) {
      panicEventData = await PanicEvent.findById(eventId);
      if (!panicEventData) {
        return sendResponse(res, 401, false, "panic event not found!");
      }
    }

    return sendResponse(res, 200, true, "success", "successfully updated!", {
      data: panicEventData,
    });
  } catch (error) {
    console.error("Error updating notified contacts:", error);
    return sendResponse(
      res,
      500,
      false,
      "Internal server error!",
      error.message
    );
  }
}
async function updateAcknowledgedContacts(req, res) {
  try {
    const { eventId } = req.params;
    const { user } = req;
    if (!eventId) {
      return sendResponse(res, 401, false, "invalid request!");
    }
    //update the acknowledged contacts
    const updated = {
      acknowledgedBy: {
        userId: user.userId,
        notifiedAt: new Date(),
        response: null,
        name: user.name,
        email: user.email,
      },
    };
    const updatedPanicEvent = await PanicEvent.findOneAndUpdate(
      {
        _id: eventId,
        acknowledgedBy: {
          $not: {
            $elemMatch: { userId: user.userId },
          },
        },
      },
      { $push: updated },
      { new: true }
    );
    let panicEventData = updatedPanicEvent;
    if (!updatedPanicEvent) {
      panicEventData = await PanicEvent.findById(eventId);
      if (!panicEventData) {
        return sendResponse(res, 401, false, "panic event not found!");
      }
    }

    return sendResponse(res, 200, true, "success", "successfully updated!", {
      data: panicEventData,
    });
  } catch (error) {
    console.error("Error updating acknowledged contacts:", error);
    return sendResponse(
      res,
      500,
      false,
      "Internal server error!",
      error.message
    );
  }
}

module.exports = {
  triggerPanicEvent,
  responseHandler,
  emailViewTracker,
  resolvedPanicEvent,
  updateNotifiedContacts,
  updateAcknowledgedContacts,
  getAllPanicEvents,
  getAllPanicByUserId,
};
