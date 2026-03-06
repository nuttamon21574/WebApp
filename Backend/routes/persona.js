const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const db = admin.firestore();
const { assignPersona } = require("../services/personaEngine");
const { runRiskModel } = require("../services/mlService")

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

    // ===== RUN ML IF PERSONA = CAN PREPAY =====
if (persona === "Can Prepay") {

  const modelInput = {
    installment_to_income: userData.installment_to_income,
    credit_utilization: userData.credit_utilization,
    platform_count: userData.platform_count,
    spaylater_missed_installments: userData.spaylater_missed_installments,
    lazpaylater_missed_installments: userData.lazpaylater_missed_installments
  };

  console.log("Running ML model...");

  const result = await runRiskModel(modelInput);

  await docRef.set(
    {
      risk_tier: result.risk_tier,
      risk_updated_at: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  console.log("ML risk tier:", result.risk_tier);
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
      persona: persona
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
