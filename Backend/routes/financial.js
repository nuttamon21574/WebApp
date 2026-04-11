const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const db = admin.firestore();

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

  /* =========================
     1. GET VALUES
  ========================= */

  const laz_installment = toNumber(data.lazpaylater_monthly_installment);
  const spay_installment = toNumber(data.spaylater_monthly_installment);

  const laz_debt = toNumber(data.lazpaylater_outstanding_debt);
  const spay_debt = toNumber(data.spaylater_outstanding_debt);

  // 🔥 ต้องมี field นี้ใน user
  const income = toNumber(data.income);

  /* =========================
     2. CALCULATIONS
  ========================= */

  // 💰 รวมค่างวด
  const total_installment = laz_installment + spay_installment;

  // 💰 รวมหนี้
  const total_debt = laz_debt + spay_debt;

  const total_limit =
      toNumber(data.spaylater_limit) +
      toNumber(data.lazpaylater_limit);

  const risk_tier = "MEDIUM"; // default ไปก่อน

  // 📊 นับจำนวน platform ที่ใช้งานจริง
  let platform_count = 0;
  if (laz_debt > 0) platform_count++;
  if (spay_debt > 0) platform_count++;

  // 📉 ภาระผ่อนต่อรายได้ (DTI แบบย่อ)
  const installment_to_income =
    income > 0 ? total_installment / income : 0;

  // 📉 สัดส่วนหนี้ต่อรายได้
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

  /* =========================
     3. SAVE BACK
  ========================= */

  const updateData = {
    total_installment,
    total_debt,
    total_limit,
    platform_count,
    installment_to_income,
    credit_utilization,
    persona,
    risk_tier,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
    // =========================
    // 1. SAVE TO DTI/{uid}
    // =========================
    await dtiRef.set(updateData, { merge: true });

    // =========================
    // 2. SAVE HISTORY
    // =========================
    await dtiRef.collection("history").add({
        ...updateData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // =========================
    // 3. UPDATE USERS/{uid} (LATEST COPY)
    // =========================
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

    } catch (err) {
    console.error("❌ Firestore save error:", err);
    throw err;
    }
  return updateData;
}

/* =========================
   ROUTES
========================= */

// 🔥 POST → run calculation
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

    /* =========================
       1. CALCULATE FIRST
    ========================= */
    const calcResult = await calculateFinancialIndicators(uid);
    

    /* =========================
       2. GET UPDATED USER DATA
    ========================= */
    const snap = await userRef.get();
    const userData = snap.data();

    /* =========================
       3. GENERATE AI
    ========================= */
    const advice = await generateFinancialAdvice({
      ...userData,
      ...calcResult,   // 🔥 สำคัญมาก
      age: userData.age || 0
    });

    await db.collection("recommendation")
    .doc(uid)
    .collection("history")
    .add({
      ...advice,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  console.log("✅ Saved to Firebase");

    /* =========================
       4. RESPONSE
    ========================= */
    res.json({
      success: true,
      //calculation: calcResult,
      ai: advice
    });

  } catch (err) {
    console.error("🔥 Financial Error:", err.message);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// 🔥 GET → test route
router.get("/", (req, res) => {
  res.send("Financial route working 🚀");
});

/* =========================
   EXPORT
========================= */
module.exports = router;