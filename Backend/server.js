require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log("GEMINI KEY:", process.env.GEMINI_API_KEY);

console.log("GEMINI KEY:", GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌");



const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const admin = require("firebase-admin");

/* ================= FIREBASE ================= */

let credential;



if (process.env.FIREBASE_PRIVATE_KEY) {
// Production (Render)
console.log("Using Production Firebase Credentials");


credential = admin.credential.cert({
projectId: process.env.FB_PROJECT_ID,
clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\n/g, "\n"),
});

} else {
// Local
console.log("Using Local Firebase Credentials");

const serviceAccount = require("./serviceAccountKey.json");
credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({ credential });

/* ================= APP INIT ================= */

const app = express();


app.use(cors({ origin: "*" }))



app.use(express.json());
app.use(fileUpload());

/* ================= TEST ROUTE ================= */

app.get("/", (req, res) => {
console.log("Root API hit");
res.send("Server running 🚀");
});

/* ================= ROUTES ================= */

console.log("Loading routes...");

const uploadRoute = require("./routes/upload");
const calculateRoute = require("./routes/calculate");
const personaRoute = require("./routes/persona");
const aiRoute = require("./routes/ai");

app.use("/api", uploadRoute);
app.use("/api/calculate", calculateRoute);
app.use("/api/persona", personaRoute);
app.use("/api/ai", aiRoute);

console.log("Routes loaded ✅");

/* ================= START ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log("=================================");
console.log(`🚀 Server running on port ${PORT}`);
console.log(`AI endpoint → http://localhost:${PORT}/api/ai/generate`);
console.log("FB_PROJECT_ID:", process.env.FB_PROJECT_ID);
console.log("CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "OK" : "MISSING");
console.log("=================================");
});