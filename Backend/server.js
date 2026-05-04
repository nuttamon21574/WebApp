require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log("GEMINI KEY:", GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌");

const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const admin = require("firebase-admin");

/* ================= FIREBASE ================= */

let credential;

if (process.env.FIREBASE_PRIVATE_KEY) {
  console.log("Using Production Firebase Credentials");

  credential = admin.credential.cert({
    projectId: process.env.FB_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .trim(),
  });

} else {
  console.log("Using Local Firebase Credentials");

  const serviceAccount = require("./serviceAccountKey.json");
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({ credential });

/* ================= APP INIT ================= */

const app = express();

/* 🔥 แก้ CORS ให้ใช้ได้ทั้ง dev + prod */

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://web-app-five-virid.vercel.app"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());
app.use(fileUpload());

/* ================= TEST ROUTE ================= */

app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

/* ================= ROUTES ================= */

console.log("Loading routes...");

const uploadRoute = require("./routes/upload");
const calculateRoute = require("./routes/calculate");
const personaRoute = require("./routes/persona");
const aiRoute = require("./routes/ai");
const financialRoute = require("./routes/financial");
const mlRoute = require("./routes/ml");

app.use("/api", uploadRoute);
app.use("/api/calculate", calculateRoute);
app.use("/api/persona", personaRoute);
app.use("/api/ai", aiRoute);
app.use("/api/financial", financialRoute);
app.use("/api/ml", mlRoute);

console.log("Routes loaded ✅");

/* ================= START ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Base URL → https://your-backend.onrender.com`);
  console.log("=================================");
});