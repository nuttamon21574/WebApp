const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const { admin, db } = require("../firebaseAdmin");

/* =========================
   SAFE NUMBER
========================= */
function toNumber(value) {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function buildDate(year, month, day) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseDateString(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  const isoMatch = normalized.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) {
    const [year, month, day] = normalized.split("-").map(Number);
    return buildDate(year, month, day);
  }

  const parts = normalized.split(/[\/\-.]/).map((part) => part.trim());
  if (parts.length !== 3) {
    return null;
  }

  const [first, second, third] = parts;
  const yearFirst = first.length === 4;
  const guessYear = Number(third);

  if (yearFirst) {
    return buildDate(Number(first), Number(second), Number(third));
  }

  if (Number(first) > 12) {
    return buildDate(guessYear, Number(second), Number(first));
  }

  const dayFirstCandidate = buildDate(guessYear, Number(second), Number(first));
  if (dayFirstCandidate) {
    return dayFirstCandidate;
  }

  return buildDate(guessYear, Number(first), Number(second));
}

function calculateDaysOverdue(dueDateStr, now = new Date()) {
  const dueDate = parseDateString(dueDateStr);
  if (!dueDate) {
    return 0;
  }

  dueDate.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today.getTime() - dueDate.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return diffMs > 0 ? Math.floor(diffMs / oneDayMs) : 0;
}

/* =========================
   MAIN CALC
========================= */
async function calculateAndSaveBNPL(uid, itemId) {
  if (!uid || !itemId) {
    throw new Error("Missing uid or itemId");
  }

  const itemRef = db.collection("bnplDebt").doc(uid).collection("items").doc(itemId);
  const snap = await itemRef.get();

  if (!snap.exists) {
    console.log("❌ ITEM NOT FOUND:", uid, itemId);
    throw new Error("Item not found in Firestore");
  }

  const data = snap.data();
  const overdueDays = calculateDaysOverdue(data.dueDate);
  const isOverdue = overdueDays > 0;

  if (data.overdueDays !== overdueDays || data.isOverdue !== isOverdue) {
    await itemRef.update({
      overdueDays,
      isOverdue,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {
    ...data,
    overdueDays,
    isOverdue,
  };
}


async function calculateTotalBNPL(uid) {
  const itemsRef = db.collection("bnplDebt").doc(uid).collection("items");
  const snap = await itemsRef.get();

  let totalDebt = 0;
  let totalOutstanding = 0;
  let totalMonthly = 0;

  let lazpaylater_monthly_installment = 0;
  let lazpaylater_outstanding_debt = 0;
  let lazpaylater_original_debt = 0;
  let lazpaylater_selected_terms = 0;

  let spaylater_monthly_installment = 0;
  let spaylater_outstanding_debt = 0;
  let spaylater_original_debt = 0;
  let spaylater_selected_terms = 0;

  let bnpl_overdue_count = 0;
  let bnpl_overdue_amount = 0;
  let bnpl_overdue_max_days = 0;
  let bnpl_overdue_total_days = 0;

  const overdueUpdates = [];

  snap.forEach((doc) => {
    const d = doc.data();

    totalDebt += Number(d.totalDebt || 0);
    totalOutstanding += Number(d.outstandingDebt || 0);
    totalMonthly += Number(d.monthlyInstallment || 0);

    const provider = (d.provider || "").toLowerCase();
    const installments = toNumber(d.totalInstallments);
    const originalDebt = toNumber(d.totalDebt);
    const outstandingDebt = toNumber(d.outstandingDebt);
    const monthlyInstallment = toNumber(d.monthlyInstallment);

    const overdueDays = calculateDaysOverdue(d.dueDate);
    const isOverdue = overdueDays > 0;

    if (d.overdueDays !== overdueDays || d.isOverdue !== isOverdue) {
      overdueUpdates.push(
        doc.ref.update({
          overdueDays,
          isOverdue,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
    }

    if (isOverdue) {
      bnpl_overdue_count += 1;
      bnpl_overdue_amount += outstandingDebt;
      bnpl_overdue_total_days += overdueDays;
      bnpl_overdue_max_days = Math.max(bnpl_overdue_max_days, overdueDays);
    }

    if (provider.includes("laz")) {
      lazpaylater_monthly_installment += monthlyInstallment;
      lazpaylater_outstanding_debt += outstandingDebt;
      lazpaylater_original_debt += originalDebt;
      lazpaylater_selected_terms = Math.max(lazpaylater_selected_terms, installments);
    }

    if (provider.includes("spay")) {
      spaylater_monthly_installment += monthlyInstallment;
      spaylater_outstanding_debt += outstandingDebt;
      spaylater_original_debt += originalDebt;
      spaylater_selected_terms = Math.max(spaylater_selected_terms, installments);
    }
  });

  if (overdueUpdates.length > 0) {
    await Promise.all(overdueUpdates);
  }

  const updateData = {
    bnpl_total_debt: totalDebt,
    bnpl_total_outstanding: totalOutstanding,
    bnpl_total_monthly: totalMonthly,
    bnpl_overdue_count,
    bnpl_overdue_amount,
    bnpl_overdue_max_days,
    bnpl_overdue_total_days,
    bnpl_overdue_average_days:
      bnpl_overdue_count > 0
        ? Math.round((bnpl_overdue_total_days / bnpl_overdue_count) * 100) / 100
        : 0,
    lazpaylater_monthly_installment,
    lazpaylater_outstanding_debt,
    lazpaylater_original_debt,
    lazpaylater_selected_terms,
    spaylater_monthly_installment,
    spaylater_outstanding_debt,
    spaylater_original_debt,
    spaylater_selected_terms,
  };

  await db.collection("users").doc(uid).set(updateData, { merge: true });

  return {
    totalDebt,
    totalOutstanding,
    totalMonthly,
    ...updateData,
  };
}


/* =========================
   ROUTE
========================= */
router.post("/", async (req, res) => {
  try {
    console.log("🔥 BODY:", req.body);

    const { uid, itemId } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: "uid is required",
      });
    }

    if (itemId) {
      await calculateAndSaveBNPL(uid, itemId);
    }

    const total = await calculateTotalBNPL(uid);

    await fetch("http://localhost:5000/api/financial", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid }),
    });

    res.json({
      success: true,
      data: total,
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;