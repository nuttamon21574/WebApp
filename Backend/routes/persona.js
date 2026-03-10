const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const db = admin.firestore();
const { assignPersona } = require("../services/personaEngine");
const { runRiskModel } = require("../services/mlService")
const { generateFinancialAdvice } = require("../services/aiService");

router.get("/", (req, res) => {
  res.json({ message: "Persona API working" });
});

router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    console.log("========== PERSONA API ==========");
    console.log("UID:", uid);

    const docRef = db.collection("users").doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log("User not found:", uid);
      return res.status(404).json({ error: "User not found" });
    }

    const userData = doc.data();
    const persona = assignPersona(userData);

    console.log("Assigned Persona:", persona);

let riskTier = userData.risk_tier || "MEDIUM";

if (persona === "Can Prepay") {

  const modelInput = {
    installment_to_income: userData.installment_to_income,
    credit_utilization: userData.credit_utilization,
    platform_count: userData.platform_count,
    spaylater_missed_installments: userData.spaylater_missed_installments,
    lazpaylater_missed_installments: userData.lazpaylater_missed_installments
  };

  const result = await runRiskModel(modelInput);

  riskTier = result.risk_tier;

  await docRef.set({
    risk_tier: riskTier
  }, { merge: true });

  console.log("ML risk tier:", result.risk_tier);
}

console.log("🤖 Generating AI advice...");

const advice = await generateFinancialAdvice({
  ...userData,
  persona,
  risk_tier: riskTier
});

console.log("AI RESULT:", advice);

if (!advice.error) {

  await db.collection("recommendation").doc(uid).collection("history").add({

    userId: uid,

    financial_status: advice.financial_status || "Unknown",

    group: advice.group,
    strategy: advice.strategy,
    recommended_payment: advice.recommended_payment,
    remaining_monthly_cash: advice.remaining_monthly_cash,

    actions: advice.actions,
    benefits: advice.benefits,

    createdAt: admin.firestore.FieldValue.serverTimestamp()

  });

  console.log("AI recommendation saved");

}


    if (!persona) {
      return res.status(400).json({
        success: false,
        message: "No persona assigned"
      });
    }

    // 🔥 บันทึก persona (พยายาม update ก่อน)
    try {
      await docRef.update({
        persona: persona,
        persona_updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      // ถ้า update พลาด ใช้ set merge แทน
      await docRef.set(
        {
          persona: persona,
          persona_updated_at: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    }

    console.log("🔥 Persona saved successfully");
    console.log("================================");

  return res.json({
    success: true,
    persona: persona,
    risk_tier: riskTier,
    recommendation: advice
  });

  } catch (error) {
    console.error("Persona API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
