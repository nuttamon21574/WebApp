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
   DATE UTILS
========================= */
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
  if (!value || typeof value !== "string") return null;

  const normalized = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [y, m, d] = normalized.split("-").map(Number);
    return buildDate(y, m, d);
  }

  const parts = normalized.split(/[\/\-.]/).map((p) => p.trim());
  if (parts.length !== 3) return null;

  const [a, b, c] = parts;

  if (a.length === 4) return buildDate(Number(a), Number(b), Number(c));

  if (Number(a) > 12) return buildDate(Number(c), Number(b), Number(a));

  return buildDate(Number(c), Number(a), Number(b));
}

function calculateDaysOverdue(dueDateStr, now = new Date()) {
  const dueDate = parseDateString(dueDateStr);
  if (!dueDate) return 0;

  dueDate.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diff = today - dueDate;
  const oneDay = 86400000;

  return diff > 0 ? Math.floor(diff / oneDay) : 0;
}

/* =========================
   CALC SINGLE ITEM
========================= */
async function calculateAndSaveBNPL(uid, itemId) {
  const ref = db.collection("bnplDebt").doc(uid).collection("items").doc(itemId);
  const snap = await ref.get();

  if (!snap.exists) throw new Error("Item not found");

  const data = snap.data();

  const overdueDays = calculateDaysOverdue(data.dueDate);
  const isOverdue = overdueDays > 0;

  if (data.overdueDays !== overdueDays || data.isOverdue !== isOverdue) {
    await ref.update({
      overdueDays,
      isOverdue,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { ...data, overdueDays, isOverdue };
}

/* =========================
   CALC TOTAL
========================= */
async function calculateTotalBNPL(uid) {
  const snap = await db.collection("bnplDebt").doc(uid).collection("items").get();

  let totalDebt = 0;
  let totalOutstanding = 0;
  let totalMonthly = 0;

  let lazpaylater_monthly_installment = 0;
  let lazpaylater_outstanding_debt = 0;
  let lazpaylater_selected_terms = 0;

  let spaylater_monthly_installment = 0;
  let spaylater_outstanding_debt = 0;
  let spaylater_selected_terms = 0;

  let bnpl_overdue_count = 0;
  let bnpl_overdue_amount = 0;
  let bnpl_overdue_max_days = 0;
  let bnpl_overdue_total_days = 0;

  const updates = [];

  snap.forEach((doc) => {
    const d = doc.data();

    totalDebt += toNumber(d.totalDebt);
    totalOutstanding += toNumber(d.outstandingDebt);
    totalMonthly += toNumber(d.monthlyInstallment);

    const overdueDays = calculateDaysOverdue(d.dueDate);
    const isOverdue = overdueDays > 0;

    if (d.overdueDays !== overdueDays || d.isOverdue !== isOverdue) {
      updates.push(
        doc.ref.update({
          overdueDays,
          isOverdue,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
    }

    if (isOverdue) {
      bnpl_overdue_count++;
      bnpl_overdue_amount += toNumber(d.outstandingDebt);
      bnpl_overdue_total_days += overdueDays;
      bnpl_overdue_max_days = Math.max(bnpl_overdue_max_days, overdueDays);
    }

    const provider = (d.provider || "").toLowerCase();

    if (provider.includes("laz")) {
      lazpaylater_monthly_installment += toNumber(d.monthlyInstallment);
      lazpaylater_outstanding_debt += toNumber(d.outstandingDebt);
      lazpaylater_selected_terms = Math.max(
        lazpaylater_selected_terms,
        toNumber(d.totalInstallments)
      );
    }

    if (provider.includes("spay")) {
      spaylater_monthly_installment += toNumber(d.monthlyInstallment);
      spaylater_outstanding_debt += toNumber(d.outstandingDebt);
      spaylater_selected_terms = Math.max(
        spaylater_selected_terms,
        toNumber(d.totalInstallments)
      );
    }
  });

  if (updates.length) await Promise.all(updates);

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
        ? bnpl_overdue_total_days / bnpl_overdue_count
        : 0,
    lazpaylater_monthly_installment,
    lazpaylater_outstanding_debt,
    lazpaylater_selected_terms,
    spaylater_monthly_installment,
    spaylater_outstanding_debt,
    spaylater_selected_terms,
  };

  await db.collection("users").doc(uid).set(updateData, { merge: true });

  return updateData;
}

/* =========================
   ROUTE
========================= */
router.post("/", async (req, res) => {
  try {
    console.log("🔥 BODY:", req.body);

    const { uid, itemId } = req.body;
    if (!uid) throw new Error("uid required");

    if (itemId) {
      await calculateAndSaveBNPL(uid, itemId);
    }

    const total = await calculateTotalBNPL(uid);

    // 🔥 FIX สำคัญ: ส่ง month ไป financial
    const month = getThaiMonthKey();

    const API_URL = "https://webapp-osky.onrender.com";

    await fetch(`${API_URL}/api/financial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid,
        month, // ✅ FIX
      }),
    });

    console.log("🔥 SENT TO FINANCIAL:", month);

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