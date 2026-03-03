require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const admin = require("firebase-admin");


/* ================= FIREBASE ================= */
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
});

/* ================= APP INIT ================= */
const app = express();   // ✅ ต้องประกาศก่อนใช้

app.use(cors({
  origin: "http://localhost:5173",
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
app.listen(5000, () => {
  console.log("Server running on port 5000");
});