const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const db = admin.firestore();

const { generateFinancialAdvice } = require("../services/aiService");

/* =========================
   POST /ai
========================= */
router.post("/", async (req, res) => {
  try {
    const { uid } = req.body;

    console.log("🔥 REQUEST UID:", uid);

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: "uid is required",
      });
    }

    /* =========================
       1. GET USER DATA
    ========================= */
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = snap.data();

    console.log("📦 USER DATA LOADED");

    /* =========================
       2. GENERATE AI
    ========================= */
    const advice = await generateFinancialAdvice({
      ...userData,
      age: userData.age || 0,
    });

    console.log("🤖 AI DONE");

    if (!advice) {
      throw new Error("AI returned empty result");
    }

    /* =========================
       3. SAVE AI RESULT
    ========================= */
    console.log("🔥 BEFORE SAVE");

    const recRef = db.collection("recommendation").doc(uid);

    await recRef.set(
      {
        latest: advice,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("🔥 AFTER SAVE (LATEST)");

    await recRef.collection("history").add({
      ...advice,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("🔥 AFTER SAVE (HISTORY)");

    /* =========================
       4. RESPONSE
    ========================= */
    return res.json({
      success: true,
      ai: advice,
    });

  } catch (err) {
    console.error("🔥 AI ROUTE ERROR FULL:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* =========================
   TEST
========================= */
router.get("/", (req, res) => {
  res.send("AI route working 🤖");
});

module.exports = router;