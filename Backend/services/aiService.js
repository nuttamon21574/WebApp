const axios = require("axios");

async function generateFinancialAdvice(user) {
  try {

    /* ===============================
       REQUIRED FIELD CHECK
    =============================== */

    const requiredFields = [
      "income",
      "expense",

      "spaylater_limit",
      "spaylater_original_debt",
      "spaylater_selected_terms",
      "spaylater_monthly_installment",
      "spaylater_remaining_installments",
      "spaylater_outstanding_debt",
      "spaylater_missed_installments",

      "lazpaylater_limit",
      "lazpaylater_original_debt",
      "lazpaylater_selected_terms",
      "lazpaylater_monthly_installment",
      "lazpaylater_remaining_installments",
      "lazpaylater_outstanding_debt",
      "lazpaylater_missed_installments",

      "days_since_last_payment",

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
      if (user[field] === undefined) {
        console.log(`❌ Missing field: ${field}`);
        throw new Error(`ข้อมูลไม่ครบ: ${field}`);
      }
    }

    /* ===============================
       CALCULATE CORE VALUES
    =============================== */

    const income = Number(user.income);
    const expense = Number(user.expense);

    if (income <= 0) {
      return { error: "รายได้ต้องมากกว่า 0" };
    }

    const balance = Number((income - expense).toFixed(2));

    const total_debt =
      Number(user.spaylater_outstanding_debt) +
      Number(user.lazpaylater_outstanding_debt);

    const total_installment =
      Number(user.spaylater_monthly_installment) +
      Number(user.lazpaylater_monthly_installment);

    const ie_ratio =
      expense === 0 ? 0 : Number((income / expense).toFixed(2));

    const dti =
      Number(((total_installment / income) * 100).toFixed(2));

    const persona = (user.persona || "").trim();
    const riskTier = (user.risk_tier || "MEDIUM").toUpperCase();

    let group = "UNKNOWN";
    let strategy = "NONE";
    let recommended_payment = 0;

    /* ===============================
       DETERMINE STRATEGY
    =============================== */

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
       SYSTEM PROMPT
    =============================== */

    const prompt = `
คุณคือ AI ผู้ช่วยวางแผนการเคลียร์หนี้ BNPL สำหรับนักศึกษา

income = ${income}
expense = ${expense}
balance = ${balance}
total_debt = ${total_debt}
total_installment = ${total_installment}
I/E ratio = ${ie_ratio}
DTI = ${dti}
persona = ${persona}
group = ${group}
strategy = ${strategy}

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
       CALL GEMINI
    =============================== */

    let text;

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

      text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    } catch (error) {

      console.error(
        "Gemini API Error:",
        error.response?.data || error.message
      );

      return { error: "เรียก AI ไม่สำเร็จ" };

    }

    if (!text) {
      return { error: "AI ไม่ส่งข้อมูลกลับมา" };
    }

    /* ===============================
       PARSE JSON RESPONSE
    =============================== */

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      return { error: "AI ส่ง JSON ไม่ถูกต้อง" };
    }

    if (ie_ratio <= 1) {

      parsed.actions = parsed.actions || [];

      parsed.actions.push(
        "ควรพิจารณาหาแหล่งรายได้เพิ่มเติมเพื่อให้ I/E ratio มากกว่า 1"
      );

    }

    return parsed;

  } catch (error) {

    console.error("AI Generation Error:", error);

    return {
      error: "เกิดข้อผิดพลาดในการสร้างคำแนะนำ"
    };

  }
}

module.exports = { generateFinancialAdvice };