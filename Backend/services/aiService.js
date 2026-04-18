const axios = require("axios");

async function generateFinancialAdvice(user) {

  /* ===============================
     FALLBACK RESPONSE (กัน undefined)
  =============================== */

  const fallbackResponse = {
    financial_status: "ไม่สามารถวิเคราะห์คำแนะนำทางการเงินได้",
    group: "UNKNOWN",
    strategy: "NONE",
    actions: [],
    recommended_payment: 0,
    remaining_monthly_cash: 0,
    benefits: []
  };

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

  // 🔥 Allow missing fields with defaults
  const defaults = {
    income: 10000, // default income for calculation
    expense: 0,
    spaylater_limit: 0,
    lazpaylater_limit: 0,
    spaylater_missed_installments: 0,
    lazpaylater_missed_installments: 0,
    balance: 0,
  };

  for (const field of requiredFields) {
    if (user[field] === undefined || user[field] === null) {
      if (field in defaults) {
        user[field] = defaults[field];
        continue;
      }
      // 🔥 allow null สำหรับ risk_tier
      if (field === "risk_tier") {
        user[field] = "MEDIUM";
        continue;
      }

      return fallbackResponse;
    }
  }

  /* ===============================
     2️⃣ CORE VALUES
  =============================== */

  const income = Number(user.income);
  const expense = Number(user.expense);
  const balance = Number(user.balance);
  const total_debt = Number(user.total_debt);
  const total_installment = Number(user.total_installment);

  // 🔥 Allow zero income for now
  // if (income <= 0) {
  //   return fallbackResponse;
  // }

  const ie_ratio =
    expense === 0 ? 0 : Number((income / expense).toFixed(2));

  const dti =
    income > 0 ? Number(((total_installment / income) * 100).toFixed(2)) : 0;

  // 🔥 Allow zero debt for now
  // if (total_debt === 0) {
  //   return fallbackResponse;
  // }

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
  คุณคือผู้ช่วยวางแผนการเงิน เพศหญิง อายุ 21 ปี ที่ช่วยนักศึกษาจัดการและวางแผนเคลียร์หนี้ BNPL

  เวลาพูดกับผู้ใช้ ให้ใช้คำเรียกตามอายุของผู้ใช้:
  - ถ้าอายุ > 21 ปี ให้เรียกว่า "พี่"
  - ถ้าอายุ = 21 ปี ให้เรียกว่า "คุณ"
  - ถ้าอายุ < 21 ปี ให้เรียกว่า "น้อง"

  สไตล์การตอบ:
  - เป็นมิตร เหมือนที่ปรึกษาการเงินส่วนตัว
  - ใช้ภาษาง่าย ไม่ซับซ้อน
  - เน้นวิธีทำจริงในชีวิตประจำวัน
  - ช่วยวางแผนการเงินและลดหนี้อย่างเป็นขั้นตอน

  ข้อมูลผู้ใช้:
  age: ${user.age}
  income: ${income}
  expense: ${expense}
  balance: ${balance}
  total_debt: ${total_debt}
  total_installment: ${total_installment}
  I/E ratio: ${ie_ratio}
  DTI: ${dti}%
  persona: ${persona}
  group: ${group}
  strategy: ${strategy}

  กฎสำคัญ:
  - ถ้า I/E ratio ≤ 1 → ต้องแนะนำให้เพิ่มรายได้
  - ห้ามเปลี่ยนค่า group เด็ดขาด
  - ต้องตอบกลับเป็น JSON เท่านั้น
  - actions ต้องมี 3 ข้อพอดี
  - benefits ต้องมี 3 ข้อพอดี
  - ข้อความต้องสั้น กระชับ และนำไปใช้ได้จริง

  การจัดกลุ่มหนี้ (เลือกได้แค่ 1 กลุ่มเท่านั้น):

  1) FULL_CLEARANCE
  - balance > หนี้ทั้งหมดที่ค้าง
  - แนะนำ: ปิดหนี้ทั้งหมดทันที

  2) CAN_PREPAY
  - balance > ยอดหนี้ที่ต้องจ่ายรายเดือน
  - ดู risk_tier:
    - low → ใช้ Avalanche method (ปิดหนี้ดอกเบี้ยสูงก่อน)
    - medium → ใช้ Snowball method (ปิดหนี้ยอดเล็กก่อน)
    - high → จ่ายขั้นต่ำทุกก้อน

  - ต้องระบุ “หนี้ที่ควรปิดก่อน” อย่างชัดเจน โดยเลือก 1 ก้อนแรกเท่านั้น:
    - risk_tier = low → เลือกหนี้ที่ “ดอกเบี้ยสูงที่สุด” ก่อน
    - risk_tier = medium → เลือกหนี้ที่ “ยอดคงค้างน้อยที่สุด” ก่อน
    - risk_tier = high → ไม่มีหนี้ที่ต้องปิดก่อน ให้จ่ายขั้นต่ำทุกก้อน

  3) CAN_PAY_MINIMUM
  - balance = ยอดหนี้ที่ต้องจ่ายรายเดือน
  - แนะนำ: จ่ายขั้นต่ำเท่านั้น

  4) LOAN_ROLLOVER
  - balance < ยอดหนี้ที่ต้องจ่ายรายเดือน AND total_installment = 1
  - แนะนำ: เลื่อนชำระหนี้

  รูปแบบ JSON ที่ต้องตอบ:
  {
    "financial_status": "",
    "group": "${group}",
    "strategy": "${strategy}",
    "actions": [
      "",
      "",
      ""
    ],
    "recommended_payment": ${recommended_payment},
    "remaining_monthly_cash": ${remaining_monthly_cash},
    "benefits": [
      "",
      "",
      ""
    ]
  }`;

  /* ===============================
     5️⃣ CALL GEMINI
  =============================== */

  try {

    console.log("🤖 Generating financial advice...");

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
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
      return fallbackResponse;
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      return fallbackResponse;
    }

    /* ===============================
       6️⃣ SAFETY FIX
    =============================== */

    parsed.group = parsed.group || group || "UNKNOWN";
    parsed.strategy = parsed.strategy || strategy || "NONE";

    parsed.actions = parsed.actions || [];
    parsed.benefits = parsed.benefits || [];

    parsed.recommended_payment =
      parsed.recommended_payment ?? recommended_payment;

    parsed.remaining_monthly_cash =
      parsed.remaining_monthly_cash ?? remaining_monthly_cash;

    /*if (ie_ratio <= 1) {
      parsed.actions.push(
        "ควรพิจารณาหาแหล่งรายได้เพิ่มเติมเพื่อให้ I/E ratio มากกว่า 1"
      );
    }*/

    console.log("AI RESULT:", parsed);

    return parsed;

  }

  catch (error) {

    console.error(
      "Gemini API Error:",
      error.response?.data || error.message
    );

    return fallbackResponse;

  }

}

module.exports = { generateFinancialAdvice };