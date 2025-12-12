const sendResponse = require("../utils/sendResponse");
const {
  sendPanic,
  savePanicEvent,
  getAllEvents,
  getAllEventByUserId,
  updateAcknowledgedFromEmail,
  emailTracker,
  updateResolvedEvents,
  updateNotified,
  updateAcknowledgedBy,
} = require("../services/panicAlert.service");
const { decodeToken, getTrackingImage } = require("../utils/helper");
const { default: mongoose } = require("mongoose");
async function triggerPanicEvent(req, res) {
  try {
    console.log("triggering panic event...");
    const { user } = req;
    console.log("user:", user);
    if (!req.body || req.body.length === 0) {
      return sendResponse(res, 400, false, "invalid request!");
    }
    const { location } = req.body;
    if (!location || !Array.isArray(location.coordinates)) {
      return sendResponse(
        res,
        400,
        false,
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
    console.log("panic event:", panicEvent);
    const newPanicEvent = await savePanicEvent(panicEvent);
    panicEvent["sosroomId"] = newPanicEvent._id;
    console.log("new panic event:", newPanicEvent);
    if (!newPanicEvent) {
      return sendResponse(res, 400, false, "failed to save panic event!");
    }
    await sendPanic(user.userId, location, newPanicEvent._id);
    console.log("panic event sent to trusted contacts!");
    //save the panic event to the database

    // console.log("new event created:", newPanicEvent);
    sendResponse(res, 200, true, "success", {
      message: "Panic event triggered successfully.",
      data: newPanicEvent,
    });
  } catch (error) {
    console.error("Error triggering panic event:", error);
    return sendResponse(
      res,
      500,
      false,
      "error in triggering panic event!",
      error.message
    );
  }
}
async function getAllPanicEvents(req, res) {
  try {
    console.log("getting all panic events...");
    const response = await getAllEvents(req.query);

    const { events, analysis } = response;

    if (!events || events.length === 0) {
      return sendResponse(res, 200, true, "no panic events found!", []);
    }
    return sendResponse(res, 200, true, "success", {
      message: "Panic events retrieved successfully.",
      data: events,
      analysis: analysis,
    });
  } catch (error) {
    console.error("Error getting all panic events:", error);
    return sendResponse(res, 500, false, "Internal server error!");
  }
}
async function getAllPanicByUserId(req, res) {
  try {
    console.log("getting all panic events by user id...");
    const { user } = req;
    const { panicEvents, analysis } = await getAllEventByUserId(
      user,
      req.query
    );
    if (!panicEvents) {
      return sendResponse(res, 400, false, "failed to get panic events!");
    }
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
//from the email response, update the acknowledgedBy field in the panic event
async function responseHandler(req, res) {
  try {
    console.log("response handler called!");
    const token = req.query.token;
    const secret = process.env.RESPONSE_TOKEN_SECRET;
    const decodedToken = decodeToken(token, secret);

    const { success, message } = await updateAcknowledgedFromEmail(
      decodedToken
    );

    if (!success) {
      return res.send(message);
    }

    res.redirect(
      `${process.env.GMAIL_REDIRECT_URL}?response=${decodeToken.response}&victim=${decodedToken.name}$mapUrl=${message}`
    );
  } catch (error) {
    // console.error("Error handling response:", error);
    return sendResponse(
      res,
      500,
      false,
      "error in updating acknowledgement from email!"
    );
  }
}
//from email, update the notified contacts
async function emailViewTracker(req, res) {
  try {
    console.log("email view tracker called!");
    const token = req.query.token;
    const secret = process.env.TRACKING_TOKEN_SECRET;
    const decodeToken = decodeToken(token, secret);
    // console.log("decoded token:", decodeToken);
    const { success, message } = await emailTracker(decodeToken);
    if (!success) {
      return res.send(message);
    }

    //send the response to the image href
    const img = getTrackingImage();
    res.set("Content-Type", "image/png");
    res.send(img);
  } catch (error) {
    console.error("Error updating notified contacts:", error);
    return res.status(500).send("invalid tracking link!");
  }
}

async function resolvedPanicEvent(req, res) {
  try {
    console.log("updating resolved panic event...");
    const { eventId } = req.params;
    const { user } = req;
    if (!eventId || mongoose.Types.ObjectId.isValid(eventId)) {
      return sendResponse(res, 400, false, "invalid request!");
    }
    //toggle the resolved status of the panic event,
    //and update the resolvedBy field with the userId of the user who resolved it

    const response = await updateResolvedEvents(eventId, user.userId);
    if (!response.success) {
      return sendResponse(res, 400, false, response.message);
    }
    sendResponse(res, 200, true, "success", {
      message: "Panic event resolved successfully.",
      data: response.data,
    });
  } catch (error) {
    console.error("Error updating resolved panic event:", error);
    return sendResponse(
      res,
      500,
      false,
      "error in updating resolved panic event!",
      error.message
    );
  }
}
async function updateNotifiedContacts(req, res) {
  try {
    console.log("updating notified contacts...");
    const { eventId } = req.params;
    const { user } = req;
    if (!eventId) {
      return sendResponse(res, 400, false, "invalid request!");
    }
    const response = await updateNotified(eventId, user);
    if (!response.success) {
      return sendResponse(res, 400, false, response.message);
    }

    return sendResponse(res, 200, true, "success", "successfully updated!", {
      data: response.data,
    });
  } catch (error) {
    console.error("Error updating notified contacts:", error);
    return sendResponse(
      res,
      500,
      false,
      "error in updating notified users!",
      error.message
    );
  }
}
//TODO: the front end should send the response of the user,
async function updateAcknowledgedContacts(req, res) {
  try {
    console.log("updating acknowledged contacts...");
    const { eventId } = req.params;
    const { user } = req;
    const { response = null } = req.body;
    if (!eventId) {
      return sendResponse(res, 400, false, "invalid request!");
    }
    //update the acknowledged contacts
    const result = await updateAcknowledgedBy(eventId, user, response);
    if (!result.success) {
      return sendResponse(res, 400, false, result.message);
    }

    return sendResponse(res, 200, true, "success", "successfully updated!", {
      data: result.data,
    });
  } catch (error) {
    console.error("Error updating acknowledged contacts:", error);
    return sendResponse(
      res,
      500,
      false,
      "error in updating acknowledged user!",
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
