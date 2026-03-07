const axios = require("axios");

async function generateFinancialAdvice(user) {

  /* ===============================
     1️⃣ REQUIRED FIELD CHECK
  =============================== */

  const requiredFields = [

    "income",
    "expense",

    "spaylater_limit",
    "spaylater_outstanding_debt",
    "spaylater_monthly_installment",
    "spaylater_missed_installments",

    "lazpaylater_limit",
    "lazpaylater_outstanding_debt",
    "lazpaylater_monthly_installment",
    "lazpaylater_missed_installments",

    "balance",
    "platform_count",

    "total_installment",
    "total_debt",
    "total_limit",

    "installment_to_income",
    "credit_utilization",

    "persona",
    "risk_tier"
  ];

  for (const field of requiredFields) {
    if (user[field] === undefined || user[field] === null) {
      return { error: `ข้อมูลไม่ครบ: ${field}` };
    }
  }

  /* ===============================
     2️⃣ CORE VALUES
  =============================== */

  const income = Number(user.income);
  const expense = Number(user.expense);

  if (income <= 0) {
    return { error: "รายได้ต้องมากกว่า 0" };
  }

  const balance = Number(user.balance);

  const total_debt = Number(user.total_debt);
  const total_installment = Number(user.total_installment);

  const ie_ratio =
    expense === 0 ? 0 : Number((income / expense).toFixed(2));

  const dti =
    Number(((total_installment / income) * 100).toFixed(2));

  if (total_debt === 0) {
    return { error: "ไม่พบยอดหนี้ BNPL" };
  }

  /* ===============================
     3️⃣ DETERMINE GROUP + STRATEGY
  =============================== */

  const persona = (user.persona || "").trim();
  const riskTier = (user.risk_tier || "MEDIUM").toUpperCase();

  let group = "UNKNOWN";
  let strategy = "NONE";
  let recommended_payment = 0;

  if (persona === "Full Clearance" && balance > total_debt) {

    group = "FULL_CLEARANCE";
    recommended_payment = total_debt;

  }

  else if (persona === "Can Prepay") {

    group = "CAN_PREPAY";

    if (riskTier === "HIGH") {

      strategy = "MINIMUM_ONLY";
      recommended_payment = total_installment;

    }

    else if (riskTier === "MEDIUM") {

      strategy = "SNOWBALL";
      recommended_payment = Math.min(balance * 0.8, total_debt);

    }

    else {

      strategy = "AVALANCHE";
      recommended_payment = Math.min(balance * 0.8, total_debt);

    }

  }

  else if (persona === "Can Pay Minimum") {

    group = "CAN_PAY_MINIMUM";
    recommended_payment = total_installment;

  }

  else if (persona === "Loan Rollover") {

    group = "LOAN_ROLLOVER";
    recommended_payment = total_installment;

  }

  const remaining_monthly_cash =
    Number((balance - recommended_payment).toFixed(2));

  /* ===============================
     4️⃣ SYSTEM PROMPT
  =============================== */

  const prompt = `
คุณคือ AI ผู้ช่วยวางแผนการเคลียร์หนี้ BNPL สำหรับนักศึกษา

ข้อมูลผู้ใช้:
income = ${income}
expense = ${expense}
balance = ${balance}
total_debt = ${total_debt}
total_installment = ${total_installment}
I/E ratio = ${ie_ratio}
DTI = ${dti}%
persona = ${persona}
group = ${group}
strategy = ${strategy}

กฎ:
- ถ้า I/E ratio ≤ 1 ให้แนะนำเพิ่มรายได้
- ห้ามเปลี่ยน group
- ถ้า strategy เป็น AVALANCHE ให้เน้นปิดหนี้ดอกสูงก่อน
- ถ้า strategy เป็น SNOWBALL ให้เน้นปิดยอดเล็กก่อน
- ถ้า strategy เป็น MINIMUM_ONLY ให้เน้นรักษาสภาพคล่อง

ตอบ JSON เท่านั้น

{
 "financial_status": "...",
 "group": "${group}",
 "strategy": "${strategy}",
 "actions": ["...", "..."],
 "recommended_payment": ${recommended_payment},
 "remaining_monthly_cash": ${remaining_monthly_cash},
 "benefits": ["...", "..."]
}
`;

  /* ===============================
     5️⃣ CALL GEMINI
  =============================== */

  try {

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
      }
    );

    const text =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return { error: "AI ไม่ส่งข้อมูลกลับมา" };
    }

    const parsed = JSON.parse(text);

    if (ie_ratio <= 1) {

      parsed.actions = parsed.actions || [];

      parsed.actions.push(
        "ควรพิจารณาหาแหล่งรายได้เพิ่มเติมเพื่อให้ I/E ratio มากกว่า 1"
      );

    }

    return parsed;

  }

  catch (error) {

    console.error("Gemini API Error:",
      error.response?.data || error.message
    );

    return {
      error: "ไม่สามารถเชื่อมต่อ AI ได้ กรุณาลองใหม่อีกครั้ง"
    };

  }

}

module.exports = { generateFinancialAdvice };