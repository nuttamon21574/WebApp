const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const { db } = require("../firebaseAdmin");
const { generateFinancialAdvice } = require("../services/aiService");

/* =========================
   POST /ai
========================= */
router.post("/", async (req, res) => {
  try {
    const { uid, month } = req.body;

    console.log("🔥 REQUEST:", { uid, month });
    console.log("🔥 REQUEST:", { uid, month });

    // ✅ validate
    if (!uid || !month) {
      return res.status(400).json({
        success: false,
        error: "uid and month are required",
      });
    }

    console.log("✅ INPUT OK:", { uid, month });
    
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

    /* =========================
       2. GET DEBT DATA
    ========================= */
    const debtSnap = await db
      .collection("bnplDebt")
      .doc(uid)
      .collection("items")
      .get();

    let total_debt = 0;
    let total_installment = 0;

    debtSnap.forEach((doc) => {
      const d = doc.data();
      total_debt += Number(d.outstandingDebt || 0);
      total_installment += Number(d.monthlyInstallment || 0);
    });

    console.log("📦 USER + DEBT READY");

    /* =========================
       3. GENERATE AI
    ========================= */
    const advice = await generateFinancialAdvice({
      ...userData,
      age: userData.age || 0,
      total_debt,
      total_installment,
      platform_count: debtSnap.size,
    });

    if (!advice) {
      throw new Error("AI returned empty result");
    }

    console.log("🤖 AI GENERATED");

    /* =========================
       4. NORMALIZE DATA
    ========================= */
    const normalizedAdvice = {
      ...advice,
      recommended_payment: Number(advice.recommended_payment || 0),
      remaining_monthly_cash: Number(advice.remaining_monthly_cash || 0),
      actions: advice.actions || [],
      benefits: advice.benefits || [],
    };

    /* =========================
       5. SAVE TO FIRESTORE
    ========================= */
    const recRef = db.collection("recommendation").doc(uid);

    // ✅ latest (dashboard ใช้)
    await recRef.set(
      {
        latest: normalizedAdvice,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // ✅ history (เก็บทุกครั้ง)
    await recRef.collection("history").add({
      ...normalizedAdvice,
      month,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ monthly (FIX สำคัญ 🔥)
    await recRef
      .collection("monthly")
      .doc(month) // 🔥 ใช้เดือนจาก frontend
      .set(
        {
          ...normalizedAdvice,
          month,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, // กัน overwrite
      );

    console.log("💾 SAVED MONTH:", month);

    /* =========================
       6. RESPONSE
    ========================= */
    return res.json({
      success: true,
      ai: normalizedAdvice,
    });

  } catch (err) {
    console.error("🔥 AI ROUTE ERROR:", err);

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