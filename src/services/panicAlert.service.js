const { getIO } = require("../config/socket.config");
const PanicEvent = require("../models/panicEvent.model");
const { getGoogleMapURL } = require("../utils/helper");
const sendAlertToAdminAndSecurity = require("../utils/sendToAdminAndSecurity");
const sendAlertToTrustedContacts = require("../utils/sendToTrustedContacts");
const { findUserById, findAdminAndSecurity } = require("./auth.service");

async function sendPanic(userId, location, eventId) {
  //get the user details from the database
  console.log("sending panic event...");
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
  // console.log("userInfo:", userInfo);
  const trustedContacts = userInfo.trustedContacts;
  const adminAndGuards = await findAdminAndSecurity();
  const io = getIO();
  const onlineUsers = global.onlineUsers;
  console.log("online users:", onlineUsers);
  const userPayLoad = getUserPayload(userInfo, location, eventId);
  console.log("fine:");
  console.log("userPayLoad:", userPayLoad);
  await sendAlertToTrustedContacts(
    trustedContacts,
    userPayLoad,
    io,
    onlineUsers
  );
  console.log("alert sent to trusted contacts!");
  await sendAlertToAdminAndSecurity(
    adminAndGuards,
    userPayLoad,
    io,
    onlineUsers
  );
}
async function savePanicEvent(panicEvent) {
  const newPanicEvent = new PanicEvent(panicEvent);
  await newPanicEvent.save();
  return newPanicEvent;
}

function getUserPayload(userInfo, location, eventId) {
  if (typeof location !== "object" || !Array.isArray(location.coordinates)) {
    throw new Error("Invalid location data provided!");
  }
  if (location.coordinates.length !== 2) {
    throw new Error("Invalid coordinates provided!");
  }

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
    return {
      success: false,
      message: "invalid token",
    };
  }
  // console.log("decoded token:", decodedToken);
  const { email, response, eventId, role } = decodedToken;
  if (!email || !response || !eventId || !role) {
    return {
      success: false,
      message: "invalid token!",
    };
  }
  //find panic event by id
  const panicEvent = await PanicEvent.findById(eventId);
  if (!panicEvent) {
    return {
      success: false,
      message: "panic event not found!",
    };
  }
  //check if the event is already acknowledged by the user
  const acknowledgedBy = panicEvent.acknowledgedBy.some(
    (acknowledgedBy) =>
      acknowledgedBy.email === email && acknowledgedBy.response === response
  );
  //push the new acknowledgement
  if (!acknowledgedBy) {
    panicEvent.acknowledgedBy.push({
      userId: decodedToken?.userId,
      notifiedAt: new Date(),
      response: response,
      name: decodedToken.name,
      email: decodedToken?.email,
    });
    await panicEvent.save();
  }

  const mapUrl = getGoogleMapURL(
    panicEvent.location.coordinates[1],
    panicEvent.location.coordinates[0]
  );
  // console.log("updated panic event:", updatedPanicEvent);
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

  //find the event
  const panicEvent = await PanicEvent.findById(eventId);
  if (!panicEvent) {
    return {
      success: "false",
      message: "no panicEvent found",
    };
  }

  //already tracked
  const alreadyTracked = panicEvent.notifications.some(
    (notification) => notification.email === email && notification.type === role
  );

  if (!alreadyTracked) {
    panicEvent.notifications.push({
      type: role,
      name: decodeToken?.name,
      email: decodeToken?.email,
      notifiedAt: new Date(),
    });
    await panicEvent.save();
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
      message: "Panic event not found!",
    };
  }

  panicEvent.resolved = !panicEvent.resolved; // toggle boolean
  panicEvent.resolvedBy = userId;
  panicEvent.resolvedAt = Date.now();

  await panicEvent.save();

  await panicEvent.populate("resolvedBy", "fullName email");

  return {
    success: true,
    message: "Panic event resolved successfully.",
    data: panicEvent,
  };
}
async function updateNotified(eventId, user) {
  const panicEvent = await PanicEvent.findById(eventId);
  if (!panicEvent) {
    return {
      success: false,
      message: "not panic event found",
    };
  }
  //check if not already notified
  const alreadyNotified = panicEvent.notifications.some(
    (notif) => notif.userId.toString() === user.userId.toString()
  );
  if (!alreadyNotified) {
    panicEvent.notifications.push({
      type: user.role,
      userId: user.userId,
      notifiedAt: new Date(),
    });

    await panicEvent.save();
  }

  return {
    success: true,
    message: alreadyNotified
      ? "User was already notified."
      : "User notification added successfully.",
    data: panicEvent,
  };
}

async function updateAcknowledgedBy(eventId, user, response) {
  //find the event
  const panicEvent = await PanicEvent.findById(eventId);

  if (!panicEvent) {
    return {
      success: false,
      message: "the event could not be found",
    };
  }

  //check user in acknowledgedBy
  const alreadyAck = panicEvent.acknowledgedBy.some(
    (ack) =>
      ack.userId.toString() === user.userId.toString() &&
      ack.response === response
  );
  if (!alreadyAck) {
    //add the user to the acknowledgedBy
    panicEvent.acknowledgedBy.push({
      userId: user.userId,
      notifiedAt: new Date(),
      response: response,
    });
    await panicEvent.save();
  }

  return {
    success: true,
    message: alreadyAck
      ? "You already acknowledged with the same response."
      : "Acknowledgement recorded successfully.",
    data: panicEvent,
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
