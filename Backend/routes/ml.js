const express = require("express");
const router = express.Router();

const { db } = require("../firebaseAdmin");
const { runRiskModel } = require("../services/mlService");

router.post("/risk-tier/:UID", async (req, res) => {
  try {
    const uid = req.params.UID;

    const docRef = db.collection("users").doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userData = doc.data();

    // =========================
    // 🔥 REQUIRED CHECK
    // =========================
    if (
      userData.installment_to_income == null ||
      userData.credit_utilization == null
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // =========================
    // 🔥 PERSONA CHECK
    // =========================
    if (!userData.persona) {
      return res.status(400).json({
        success: false,
        message: "Persona not assigned yet (call /persona API first)"
      });
    }

    if (userData.persona !== "Can Prepay") {
      return res.status(400).json({
        success: false,
        message: "User not eligible for risk calculation"
      });
    }

    // =========================
    // 🔥 CACHE (กันยิง ML ซ้ำ)
    // =========================
    if (userData.risk_tier) {
      return res.json({
        success: true,
        UID: uid,
        result: {
          risk_tier: userData.risk_tier,
          cached: true
        }
      });
    }

    // =========================
    // 🔥 MODEL INPUT
    // =========================
    const modelInput = {
      model: "lr",

      installment_to_income: userData.installment_to_income ?? 0,
      credit_utilization: userData.credit_utilization ?? 0,
      platform_count: userData.platform_count ?? 0,
      spaylater_missed_installments: userData.spaylater_missed_installments ?? 0,
      lazpaylater_missed_installments: userData.lazpaylater_missed_installments ?? 0
    };

    console.log("🔥 MODEL INPUT:", modelInput);

    // =========================
    // 🔥 RUN ML
    // =========================
    let result;

    try {
      result = await runRiskModel(modelInput);
    } catch (err) {
      console.error("❌ ML FAILED:", err.message);

      return res.status(500).json({
        success: false,
        message: "ML processing failed"
      });
    }

    // =========================
    // 🔥 SAVE RESULT
    // =========================
    await docRef.set(
      {
        risk_tier: result.risk_tier,
        risk_probabilities: result.probabilities,
        risk_updated_at: new Date()
      },
      { merge: true }
    );

    // =========================
    // 🔥 RESPONSE
    // =========================
    return res.json({
      success: true,
      UID: uid,
      result
    });

  } catch (error) {
    console.error("🔥 ML ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;