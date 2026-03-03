require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const admin = require("firebase-admin");

/* ================= FIREBASE ================= */

let credential;

if (process.env.FIREBASE_PRIVATE_KEY) {
  // Production (Render)
  credential = admin.credential.cert({
    projectId: process.env.FB_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
} else {
  // Local
  const serviceAccount = require("./serviceAccountKey.json");
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({ credential });
/* ================= APP INIT ================= */
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend.vercel.app"
  ],
  methods: ["GET", "POST"],
}));

app.use(express.json());
app.use(fileUpload());

/* ================= ROUTES ================= */
const uploadRoute = require("./routes/upload");
const calculateRoute = require("./routes/calculate");
const personaRoute = require("./routes/persona");
const aiRoute = require("./routes/ai");

app.use("/api", uploadRoute);
app.use("/api/calculate", calculateRoute);
app.use("/api/persona", personaRoute);
app.use("/api/ai", aiRoute);

/* ================= START ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});