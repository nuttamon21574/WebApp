const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { generateFinancialAdvice } = require("../services/aiService");

const db = admin.firestore();

/* ============================= */
/* VERIFY USER FUNCTION */
/* ============================= */

async function verifyUser(req) {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }

  const token = authHeader.split("Bearer ")[1];

  const decodedToken = await admin.auth().verifyIdToken(token);

  console.log("🔑 Decoded Token UID:", decodedToken.uid);

  return decodedToken.uid;
}

/* ============================= */
/* TEST ROUTE */
/* ============================= */

router.get("/generate", (req, res) => {
  res.send("AI route working. Use POST method.");
});

/* ============================= */
/* GENERATE AI ADVICE */
/* ============================= */

router.post("/generate", async (req, res) => {

  try {

    console.log("\n==============================");
    console.log("🚀 START AI GENERATION");
    console.log("==============================");

    /* =============================== */
    /* 1️⃣ VERIFY USER */
    /* =============================== */

    const uid = await verifyUser(req);

    console.log("✅ User verified:", uid);

    /* =============================== */
    /* 2️⃣ FETCH USER DATA */
    /* =============================== */

    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data() || {};

    console.log("✅ User data loaded");

    /* =============================== */
    /* 3️⃣ AUTO CALCULATE DATA */
    /* =============================== */

    const income = Number(userData.income || 0);
    const expense = Number(userData.expense || 0);
    const totalInstallment = Number(userData.total_installment || 0);

    const ie_ratio =
      expense > 0 ? Number((income / expense).toFixed(2)) : 0;

    const dti =
      income > 0 ? Number((totalInstallment / income).toFixed(2)) : 0;

    console.log("📊 IE Ratio:", ie_ratio);
    console.log("📊 DTI:", dti);

    /* =============================== */
    /* 4️⃣ GENERATE AI */
    /* =============================== */

    console.log("🤖 Generating financial advice...");

    const advice = await generateFinancialAdvice({
      ...userData,
      ie_ratio,
      dti
    }) || {};

    console.log("AI RAW RESPONSE:", advice);

    if (!advice || advice.error) {
      return res.status(400).json({
        error: advice?.error || "AI failed to generate advice"
      });
    }

    /* =============================== */
    /* 5️⃣ SAFE VALUES */
    /* =============================== */

    const financial_status = advice.financial_status || "";

    const group = advice.group || "UNKNOWN";
    const strategy = advice.strategy || "NONE";

    const recommended_payment = advice.recommended_payment || 0;
    const remaining_monthly_cash = advice.remaining_monthly_cash || 0;

    const actions = advice.actions || [];
    const benefits = advice.benefits || [];

    console.log("📊 RESULT:");
    console.log("Group:", group);
    console.log("Strategy:", strategy);
    console.log("Recommended Payment:", recommended_payment);

    /* =============================== */
    /* CREATE USER RECOMMENDATION DOC */
    /* =============================== */

    await db
    .collection("recommendation")
    .doc(uid)
    .set({
      userId: uid
    }, { merge: true });
    /* =============================== */
    /* 6️⃣ SAVE HISTORY */
    /* =============================== */

    console.log("💾 Saving recommendation...");

    await db
      .collection("recommendation")
      .doc(uid)
      .collection("history")
      .add({

        income,
        expense,

        balance: userData.balance || 0,
        total_debt: userData.total_debt || 0,
        total_installment: totalInstallment,

        ie_ratio,
        dti,

        persona: userData.persona || "unknown",

        financial_status,

        group,
        strategy,

        recommended_payment,
        remaining_monthly_cash,

        actions,
        benefits,

        createdAt: admin.firestore.FieldValue.serverTimestamp(),

    });

    /* =============================== */
    /* 7️⃣ UPDATE USER SNAPSHOT */
    /* =============================== */

    console.log("📊 Updating user snapshot...");

    await db.collection("users").doc(uid).set({

      last_financial_status: financial_status,

      last_group: group,
      last_strategy: strategy,
      last_recommended_payment: recommended_payment,
      last_updated: admin.firestore.FieldValue.serverTimestamp(),

    }, { merge: true });

    console.log("🎉 AI FINISHED SUCCESSFULLY\n");

    /* =============================== */
    /* 8️⃣ RETURN RESPONSE */
    /* =============================== */

    res.json({

      financial_status,

      group,
      strategy,

      recommended_payment,
      remaining_monthly_cash,

      actions,
      benefits

    });

  }

  catch (err) {

    console.error("\n❌ AI ERROR");
    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

module.exports = router;