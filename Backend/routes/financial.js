const express = require("express");
const router = express.Router();
const { admin, db } = require("../firebaseAdmin");

const { assignPersona } = require("../services/personaEngine");
const { generateFinancialAdvice } = require("../services/aiService");

/* =========================
   SAFE NUMBER
========================= */
function toNumber(value) {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/* =========================
   🔥 FIX: THAI MONTH
========================= */
function getThaiMonthKey() {
  const now = new Date();
  const thai = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  return `${thai.getFullYear()}-${String(
    thai.getMonth() + 1
  ).padStart(2, "0")}`;
}

/* =========================
   CORE CALCULATION
========================= */
async function calculateFinancialIndicators(uid) {
  const userRef = db.collection("users").doc(uid);
  const dtiRef = db.collection("DTI").doc(uid);
  const snap = await userRef.get();

  if (!snap.exists) {
    throw new Error("User not found");
  }

  const data = snap.data();

  const laz_installment = toNumber(data.lazpaylater_monthly_installment);
  const spay_installment = toNumber(data.spaylater_monthly_installment);

  const laz_debt = toNumber(data.lazpaylater_outstanding_debt);
  const spay_debt = toNumber(data.spaylater_outstanding_debt);

  const income = toNumber(data.income);

  const total_installment = laz_installment + spay_installment;
  const total_debt = laz_debt + spay_debt;

  const total_limit =
    toNumber(data.spaylater_limit) +
    toNumber(data.lazpaylater_limit);

  let platform_count = 0;
  if (laz_debt > 0) platform_count++;
  if (spay_debt > 0) platform_count++;

  const installment_to_income =
    income > 0 ? total_installment / income : 0;

  const credit_utilization =
    income > 0 ? total_debt / income : 0;

  const persona = assignPersona({
    balance: data.balance,
    total_debt,
    total_installment,
    spaylater_monthly_installment: data.spaylater_monthly_installment,
    lazpaylater_monthly_installment: data.lazpaylater_monthly_installment,
    spaylater_selected_terms: data.spaylater_selected_terms,
    lazpaylater_selected_terms: data.lazpaylater_selected_terms,
  });

  const updateData = {
    total_installment,
    total_debt,
    total_limit,
    platform_count,
    installment_to_income,
    credit_utilization,
    persona,
    risk_tier: "MEDIUM",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await dtiRef.set(updateData, { merge: true });

  await dtiRef.collection("history").add({
    ...updateData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await userRef.set(
    {
      installment_to_income,
      credit_utilization,
      total_installment,
      total_debt,
      platform_count,
      persona,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return updateData;
}

/* =========================
   ROUTE
========================= */
router.post("/", async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: "uid is required",
      });
    }

    const userRef = db.collection("users").doc(uid);

    // 1️⃣ CALCULATE
    const calcResult = await calculateFinancialIndicators(uid);

    // 2️⃣ GET UPDATED USER
    const snap = await userRef.get();
    const userData = snap.data();

    // 3️⃣ GENERATE AI
    /*const advice = await generateFinancialAdvice({
      ...userData,
      ...calcResult,
      age: userData.age || 0,
    });

    // 🔥 FIX เดือน (สำคัญสุด)
    const month = getThaiMonthKey();
    console.log("🔥 SAVE MONTH:", month);

    const recRef = db.collection("recommendation").doc(uid);

    // ✅ latest
    await recRef.set(
      {
        latest: advice,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // ✅ monthly (overwrite จริง)
    await recRef
      .collection("monthly")
      .doc(month)
      .set({
        ...advice,
        month,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // ✅ history
    await recRef.collection("history").add({
      ...advice,
      month,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });*/

    console.log("✅ Saved to Firebase");

    res.json({
      success: true,
      data: calcResult,
    });

  } catch (err) {
    console.error("🔥 Financial Error:", err.message);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* =========================
   TEST
========================= */
router.get("/", (req, res) => {
  res.send("Financial route working 🚀");
});

module.exports = router;