const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { generateFinancialAdvice } = require("../services/aiService");

router.get("/generate", (req, res) => {
  res.send("AI route working. Use POST method.");
});

router.post("/generate", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const advice = await generateFinancialAdvice(req.body);

    if (advice.error) {
      return res.json(advice);
    }

    const db = admin.firestore();

    /* ===============================
       1️⃣ เก็บ history ใน ai_advice
    =============================== */
    await db.collection("ai_advice").add({
      userId,
      ...advice,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    /* ===============================
       2️⃣ สร้างหรืออัปเดต snapshot ล่าสุดใน users
    =============================== */
    await db.collection("users").doc(userId).set(
      {
        last_group: advice.group,
        last_recommended_payment: advice.recommended_payment,
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true } // 🔥 สำคัญมาก
    );

    res.json(advice);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI Error" });
  }
});

module.exports = router;