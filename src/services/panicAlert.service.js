const { getIO } = require("../config/socket.config");
const PanicEvent = require("../models/panicEvent.model");
const { getGoogleMapURL } = require("../utils/helper");
const sendAlertToAdminAndSecurity = require("../utils/sendToAdminAndSecurity");
const sendAlertToTrustedContacts = require("../utils/sendToTrustedContacts");
const { findUserById, findAdminAndSecurity } = require("./auth.service");

async function sendPanic(userId, location, eventId) {
  //get the user details from the database
  const userInfo = await findUserById(userId);
  if (!userInfo) {
    throw new Error("User not found!");
  }
  //      1. Get trustedContacts, guards, admins
  //    2. For each trustedContact:
  //     - If not signed up → send email
  //     - If signed up:
  //         - If online → socket.io
  //         - If offline → FCM
  //    3. For each guard and admin:
  //     - Same logic: online → socket, offline → FCM
  console.log("userInfo:", userInfo);
  const trustedContacts = userInfo.trustedContacts;
  const adminAndGuards = await findAdminAndSecurity();
  const io = getIO();
  const userPayLoad = getUserPayload(userInfo, location, eventId);
  await sendAlertToTrustedContacts(trustedContacts, userPayLoad, io);
  await sendAlertToAdminAndSecurity(adminAndGuards, userPayLoad, io);
}
async function savePanicEvent(panicEvent) {
  const newPanicEvent = new PanicEvent(panicEvent);
  await newPanicEvent.save();
  return newPanicEvent;
}

function getUserPayload(userInfo, location, eventId) {
  return {
    eventType: "panicEvent",
    user: {
      fullName: userInfo.fullName,
      studentId: userInfo.studentId,
      email: userInfo.email,
      phone: userInfo?.phone,
      location: {
        mapUrl: getGoogleMapURL(
          location.coordinates[1],
          location.coordinates[0]
        ),
        coordinates: location.coordinates,
        name: location?.address, //assuming we get the address from the frontend
      },
      originalLocation: {
        mapUrl: getGoogleMapURL(
          userInfo.location.coordinates[1],
          userInfo.location.coordinates[0]
        ),
        coordinates: userInfo.location.coordinates,
        name: userInfo?.addressDescription,
      },
      panicEventId: eventId,
    },
  };
}
async function getAllEvents(query) {
  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;
  const events = await PanicEvent.find()
    .populate("userId", "fullName studentId email")
    .populate("resolvedBy", "fullName role email")
    .populate("acknowledgedBy.responder", "fullName role email")
    .skip(skip)
    .limit(limit)
    .sort({ timeStamp: -1 });
  const totalEvents = await PanicEvent.countDocuments();
  const totalPages = Math.ceil(parseInt(totalEvents) / parseInt(limit));
  const analysis = {
    totalEvents,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
  return {
    events,
    analysis,
  };
}
async function getAllEventByUserId(user, query) {
  const { page = 1, limit = 20 } = query;
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

  return {
    panicEvents,
    analysis,
  };
}
async function updateAcknowledgedFromEmail(decodedToken) {
  if (!decodedToken || decodedToken.type !== "response") {
    return sendResponse(res, 401, false, "invalid token!");
  }
  console.log("decoded token:", decodedToken);
  const { email, response, eventId, role } = decodedToken;
  if (!email || !response || !eventId || !role) {
    return {
      success: false,
      message: "invalid token!",
    };
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
      return {
        success: false,
        message: "panic event not found!",
      };
    }
  }

  const mapUrl = getGoogleMapURL(
    panicEventData.location.coordinates[1],
    panicEventData.location.coordinates[0]
  );
  console.log("updated panic event:", updatedPanicEvent);
  //if the req is from gmail, redirect
  return {
    success: true,
    message: mapUrl,
  };
}

async function emailTracker(decodeToken) {
  if (!decodeToken || decodeToken.type !== "emailOpen") {
    return {
      success: false,
      message: "invalid token!",
    };
  }
  const { eventId, role = "contact" } = decodeToken;
  if (!eventId || !role) {
    return {
      success: false,
      message: "invalid tracking token!",
    };
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
    return {
      success: false,
      message: "invalid tracking link!",
    };
  }

  return {
    success: true,
    message: "email view tracked successfully!",
  };
}

async function updateResolvedEvents(eventId, userId) {
  const panicEvent = await PanicEvent.findById(eventId);
  if (!panicEvent) {
    return {
      success: false,
      message: "panic event not found!",
    };
  }
  panicEvent.resolved = !panicEvent.resolved;
  panicEvent.resolvedBy = userId;
  panicEvent.resolvedAt = new Date();
  await panicEvent.save();
  const updatedPanicEvent = await PanicEvent.findById(eventId).populate(
    "resolvedBy",
    "name email"
  );
  console.log("updated panic event:", updatedPanicEvent);

  return {
    success: true,
    message: "Panic event resolved successfully.",
    data: updatedPanicEvent,
  };
}
async function updateNotified(eventId, user) {
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
      return {
        success: false,
        message: "panic event not found!",
      };
    }
  }

  return {
    success: true,
    message: "successfully updated!",
    data: panicEventData,
  };
}

async function updateAcknowledgedBy(eventId, user) {
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
      return {
        success: false,
        message: "panic event not found!",
      };
    }
  }
  return {
    success: true,
    message: "successfully updated!",
    data: panicEventData,
  };
}

module.exports = {
  sendPanic,
  savePanicEvent,
  getAllEvents,
  getAllEventByUserId,
  updateAcknowledgedFromEmail,
  emailTracker,
  updateResolvedEvents,
  updateNotified,
  updateAcknowledgedBy,
};
