const admin = require("firebase-admin");
const firebaseConfigBase64 = process.env.FIREBASE_CONFIG_BASE64;
const serviceAccount = JSON.parse(
  Buffer.from(firebaseConfigBase64, "base64").toString("utf-8")
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
