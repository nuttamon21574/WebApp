const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const db = admin.firestore();

/* ============================= */
/* VERIFY USER FUNCTION */
/* ============================= */

async function verifyUser(req) {
  try {
    const authHeader = req.headers.authorization;

    console.log("AUTH HEADER:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No token provided");
    }

    const token = authHeader.split("Bearer ")[1];

    console.log("TOKEN RECEIVED:", token ? "YES" : "NO");

    const decodedToken = await admin.auth().verifyIdToken(token);

    console.log("DECODED UID:", decodedToken.uid);

    return decodedToken;

  } catch (error) {
    console.error("VERIFY TOKEN ERROR:", error.message);
    throw error;
  }
}

/* ============================= */
/* SAFE NUMBER FUNCTION */
/* ============================= */

function toNumber(value) {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/* ============================= */
/* INSTALLMENT CALCULATION */
/* ============================= */

function calculateInstallments(item) {
  const totalDebt = toNumber(item.totalDebt);
  const monthlyInstallment = toNumber(item.monthlyInstallment);
  const totalInstallments = toNumber(item.totalInstallments);
  const outstandingDebt = toNumber(item.outstandingDebt);
  const baseDate = item.purchaseDate;

  /*console.log("===== START CALCULATION =====");
  console.log("totalDebt:", totalDebt);
  console.log("monthlyInstallment:", monthlyInstallment);
  console.log("totalInstallments:", totalInstallments);
  console.log("outstandingDebt:", outstandingDebt);
  console.log("baseDate:", baseDate);*/

  let paidInstallments =
    monthlyInstallment > 0
      ? Math.floor((totalDebt - outstandingDebt) / monthlyInstallment)
      : 0;

  paidInstallments = Math.max(0, paidInstallments);
  paidInstallments = Math.min(totalInstallments, paidInstallments);

  const remainingInstallments =
    totalInstallments - paidInstallments;

  //console.log("paidInstallments:", paidInstallments);
  //console.log("remainingInstallments:", remainingInstallments);

  let duePassed = 0;
  let daysSinceLastPayment = 0;

  if (baseDate) {
    const now = new Date();
    const today = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));
    const [day, month, year] = baseDate.split("/");
    const firstDue = new Date(Date.UTC(year, month - 1, day));

    

    //console.log("today:", today);
    //console.log("firstDue:", firstDue);

    let monthsDiff =
      (today.getFullYear() - firstDue.getFullYear()) * 12 +
      (today.getMonth() - firstDue.getMonth());

    const tempDate = new Date(firstDue);
    tempDate.setMonth(firstDue.getMonth() + monthsDiff);

    if (today < tempDate) {
      monthsDiff -= 1;
    }

    duePassed = Math.max(monthsDiff, 0);
    duePassed = Math.min(duePassed, totalInstallments);

    //console.log("monthsDiff:", monthsDiff);
    //console.log("duePassed:", duePassed);

    if (duePassed > 0) {
      const lastDueDate = new Date(firstDue);
      lastDueDate.setMonth(firstDue.getMonth() + duePassed - 1);

      //console.log("lastDueDate:", lastDueDate);

      const todayOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const lastDueOnly = new Date(Date.UTC(
        lastDueDate.getUTCFullYear(),
        lastDueDate.getUTCMonth(),
        lastDueDate.getUTCDate()
      ));

      daysSinceLastPayment = Math.floor(
        (today - lastDueOnly) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastPayment < 0) {
        daysSinceLastPayment = 0;
      }

      //console.log("daysSinceLastPayment:", daysSinceLastPayment);
    }
  }

  let missedInstallments =
    duePassed - paidInstallments;

  if (missedInstallments < 0) missedInstallments = 0;

  //console.log("missedInstallments:", missedInstallments);
  //console.log("===== END CALCULATION =====");

  return {
    original_debt: Number(totalDebt.toFixed(2)),
    selected_terms: totalInstallments,
    monthly_installment: Number(monthlyInstallment.toFixed(2)),
    remaining_installments: remainingInstallments,
    outstanding_debt: Number(outstandingDebt.toFixed(2)),
    missed_installments: missedInstallments,
    days_since_last_payment: daysSinceLastPayment,
  };
}

/* ============================= */
/* SAVE ROUTE */
/* ============================= */

router.post("/calculate-and-save", async (req, res) => {
  try {
    const decoded = await verifyUser(req);
    const uid = decoded.uid;

    console.log("USER UID:", uid);

    
    const { provider, items } = req.body;

    if (!provider || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing data" });
    }

    const allowedProviders = ["SPayLater", "LazPayLater"];
    if (!allowedProviders.includes(provider)) {
      return res.status(400).json({ error: "Invalid provider" });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    let spayLimit = 0;
    let lazLimit = 0;
    let monthlyIncome = 0;
    let expense = 0;

    if (userSnap.exists) {
      const userData = userSnap.data();

      spayLimit = toNumber(userData.spaylater_limit);
      lazLimit = toNumber(userData.lazpaylater_limit);

      monthlyIncome = toNumber(userData.income);
      expense = toNumber(userData.expense);
    }

    const providerRef = db
      .collection("bnplDebt")
      .doc(uid)
      .collection("providers")
      .doc(provider);

    let totalDebtSum = 0;
    let outstandingSum = 0;
    let monthlySum = 0;
    let totalInstallments = 0;
    let purchaseDate = null;

    for (const item of items) {
      totalDebtSum += toNumber(item.totalDebt);
      outstandingSum += toNumber(item.outstandingDebt);
      monthlySum += toNumber(item.monthlyInstallment);
      totalInstallments = Math.max(
        totalInstallments,
        toNumber(item.totalInstallments)
      );

      if (!purchaseDate && item.purchaseDate) {
        purchaseDate = item.purchaseDate;
      }
    }

    const calculated = calculateInstallments({
      totalDebt: totalDebtSum,
      outstandingDebt: outstandingSum,
      monthlyInstallment: monthlySum,
      totalInstallments: totalInstallments,
      purchaseDate: purchaseDate,
    });

    await providerRef.collection("entries").add({
      ...calculated,
      provider,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await providerRef.set(
      {
        providerName: provider,
        provider_original_debt: calculated.original_debt,
        provider_selected_terms: calculated.selected_terms,
        provider_monthly: calculated.monthly_installment,
        provider_remaining_installments: calculated.remaining_installments,
        provider_outstanding: calculated.outstanding_debt,
        provider_missed_installments: calculated.missed_installments,
        provider_days_since_last_payment: calculated.days_since_last_payment,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const spaySnap = await db
      .collection("bnplDebt")
      .doc(uid)
      .collection("providers")
      .doc("SPayLater")
      .get();

    const lazSnap = await db
      .collection("bnplDebt")
      .doc(uid)
      .collection("providers")
      .doc("LazPayLater")
      .get();

    const spayData = spaySnap.exists ? spaySnap.data() : {};
    const lazData = lazSnap.exists ? lazSnap.data() : {};

    const spayOutstanding = toNumber(spayData.provider_outstanding);
    const lazOutstanding = toNumber(lazData.provider_outstanding);

    let platformCount = 0;
      if (spayOutstanding > 0) platformCount++;
      if (lazOutstanding > 0) platformCount++;

    const spayMonthly = toNumber(spayData.provider_monthly);
    const lazMonthly = toNumber(lazData.provider_monthly);

    const totalOutstandingAll = spayOutstanding + lazOutstanding;
    const totalMonthlyAll = spayMonthly + lazMonthly;

    const spayDays = toNumber(spayData.provider_days_since_last_payment);
    const lazDays = toNumber(lazData.provider_days_since_last_payment);

    

    if (userSnap.exists) {
      const userData = userSnap.data();
      spayLimit = toNumber(userData.spaylater_limit);
      lazLimit = toNumber(userData.lazpaylater_limit);
      monthlyIncome = toNumber(userData.income); // 🔥 เพิ่มบรรทัดนี้
    }

    /* ============================= */
    /* LIMIT CALCULATION */
    /* ============================= */

    const activeLimit = spayLimit + lazLimit;

    /* ============================= */
    /* CREDIT UTILIZATION */
    /* ============================= */

    const creditUtilization =
      activeLimit > 0
        ? Number((totalOutstandingAll / activeLimit).toFixed(4))
        : 0;

    /* ============================= */
    /* INSTALLMENT TO INCOME */
    /* ============================= */

    const installmentToIncome =
      monthlyIncome > 0
        ? Number((totalMonthlyAll / monthlyIncome).toFixed(2))
        : 0;


    /* ============================= */
    /* INCOME / EXPENSE RATIO */
    /* ============================= */

    const ieRatio =
      expense > 0
        ? Number((monthlyIncome / expense).toFixed(2))
        : 0;

    console.log("IE Ratio:", ieRatio);

    /* ============================= */
    /* DEBUG (optional) */
    /* ============================= */

    console.log("spayLimit:", spayLimit);
    console.log("lazLimit:", lazLimit);
    console.log("activeLimit:", activeLimit);
    console.log("totalOutstandingAll:", totalOutstandingAll);
    console.log("creditUtilization:", creditUtilization);
    console.log("installmentToIncome:", installmentToIncome);

    await userRef.set(
      {
        // SPay
        spaylater_limit: spayLimit,
        spaylater_original_debt: toNumber(spayData.provider_original_debt),
        spaylater_selected_terms: toNumber(spayData.provider_selected_terms),
        spaylater_monthly_installment: spayMonthly,
        spaylater_remaining_installments: toNumber(spayData.provider_remaining_installments),
        spaylater_outstanding_debt: spayOutstanding,
        spaylater_missed_installments: toNumber(spayData.provider_missed_installments),
        spaylater_days_since_last_payment: spayDays,

        // Laz
        lazpaylater_limit: lazLimit,
        lazpaylater_original_debt: toNumber(lazData.provider_original_debt),
        lazpaylater_selected_terms: toNumber(lazData.provider_selected_terms),
        lazpaylater_monthly_installment: lazMonthly,
        lazpaylater_remaining_installments: toNumber(lazData.provider_remaining_installments),
        lazpaylater_outstanding_debt: lazOutstanding,
        lazpaylater_missed_installments: toNumber(lazData.provider_missed_installments),
        lazpaylater_days_since_last_payment: lazDays,

        // TOTAL
        total_limit: Number(activeLimit.toFixed(2)),
        total_debt: Number(totalOutstandingAll.toFixed(2)),
        total_installment: Number(totalMonthlyAll.toFixed(2)),
        credit_utilization: creditUtilization,
        installment_to_income: installmentToIncome,
        days_since_last_payment: Math.max(spayDays, lazDays),
        platform_count: platformCount,
        ie_ratio: ieRatio,
      
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.json({
      success: true,
      ie_ratio: ieRatio,
      credit_utilization: creditUtilization
    });

  } catch (err) {
    console.error("CALC ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;