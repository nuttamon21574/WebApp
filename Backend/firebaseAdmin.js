const admin = require("firebase-admin");
const path = require("path");

// 🔥 ใช้ service account ของคุณ
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin Initialized");
}

const db = admin.firestore();

module.exports = { admin, db };