const axios = require("axios");

async function generateFinancialAdvice(user) {

  /* ===============================
     1) REQUIRED FIELD CHECK
  =============================== */

  const requiredFields = [
    "income",
    "expense",
    "spaylater_debt",
    "spaylater_monthly_due",
    "installments_spaylater",
    "spaylater_interest",
    "lazpaylater_debt",
    "lazpaylater_monthly_due",
    "installments_lazpaylater",
    "lazpaylater_interest",
    "persona",
    "platform_count",
    "risk_tier",
  ];

  for (const field of requiredFields) {
    if (user[field] === undefined || user[field] === null) {
      return { error: `ข้อมูลไม่ครบ: ${field}` };
    }
  }

  /* ===============================
     2) CALCULATE CORE VALUES
  =============================== */

  const income = Number(user.income);
  const expense = Number(user.expense);

  if (income <= 0) {
    return { error: "รายได้ต้องมากกว่า 0" };
  }

  const balance = Number((income - expense).toFixed(2));

  const total_debt = Number(
    Number(user.spaylater_debt) +
    Number(user.lazpaylater_debt)
  );

  const total_installment = Number(
    Number(user.spaylater_monthly_due) +
    Number(user.lazpaylater_monthly_due)
  );

  const ie_ratio =
    expense === 0 ? 0 : Number((income / expense).toFixed(2));

  const dti = Number(((total_installment / income) * 100).toFixed(2));

  if (total_debt === 0) {
    return { error: "ไม่พบยอดหนี้ BNPL" };
  }

  /* ===============================
     3) DETERMINE GROUP + STRATEGY
  =============================== */

  const persona = user.persona.trim();
  const riskTier = user.risk_tier.toUpperCase();

  let group = "";
  let strategy = "";
  let recommended_payment = 0;

  switch (persona) {

    case "Full Clearance":
      if (balance > total_debt) {
        group = "FULL_CLEARANCE";
        recommended_payment = total_debt;
      } else {
        return { error: "persona ไม่ตรงกับเงื่อนไขจริง" };
      }
      break;

    case "Can Prepay":
      if (balance > total_installment && balance < total_debt) {

        group = "CAN_PREPAY";

        if (riskTier === "HIGH") {
          strategy = "MINIMUM_ONLY";
          recommended_payment = total_installment;
        }

        else if (riskTier === "MEDIUM") {
          strategy = "SNOWBALL";
          recommended_payment = Math.min(
            Number((balance * 0.8).toFixed(2)),
            total_debt
          );
        }

        else if (riskTier === "LOW") {
          strategy = "AVALANCHE";
          recommended_payment = Math.min(
            Number((balance * 0.8).toFixed(2)),
            total_debt
          );
        }

        else {
          return { error: "risk_tier ไม่ถูกต้อง" };
        }

      } else {
        return { error: "persona ไม่ตรงกับเงื่อนไขจริง" };
      }
      break;

    case "Can Pay Minimum":
      if (balance === total_installment) {
        group = "CAN_PAY_MINIMUM";
        recommended_payment = total_installment;
      } else {
        return { error: "persona ไม่ตรงกับเงื่อนไขจริง" };
      }
      break;

    case "Loan Rollover":
      if (balance < total_installment) {
        group = "LOAN_ROLLOVER";
        recommended_payment = total_installment;
      } else {
        return { error: "persona ไม่ตรงกับเงื่อนไขจริง" };
      }
      break;

    default:
      return { error: "persona ไม่ถูกต้อง" };
  }

  const remaining_monthly_cash =
    Number((balance - recommended_payment).toFixed(2));

  /* ===============================
     4) SYSTEM PROMPT
  =============================== */

  const systemPrompt = `
คุณคือ AI ผู้ช่วยผู้หญิงสำหรับวางแผนการเคลียร์หนี้ BNPL สำหรับนักศึกษา

ข้อมูลจริง:
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
recommended_payment = ${recommended_payment}

กฎ:
- ถ้า I/E ratio ≤ 1 ต้องแนะนำเพิ่มรายได้
- ห้ามเปลี่ยน group
- ถ้า strategy เป็น AVALANCHE ให้แนะนำปิดดอกเบี้ยสูงก่อน
- ถ้า strategy เป็น SNOWBALL ให้แนะนำปิดยอดเล็กก่อน
- ถ้า strategy เป็น MINIMUM_ONLY ให้แนะนำรักษาสภาพคล่อง

ตอบ JSON เท่านั้น
{
  "financial_status": "...",
  "group": "${group}",
  "strategy": "${strategy}",
  "actions": [อธิบายละเอียด],
  "recommended_payment": ${recommended_payment},
  "remaining_monthly_cash": ${remaining_monthly_cash},
  "benefits": ["...", "...", "..."]
}
`;

  /* ===============================
     5) CALL GEMINI
  =============================== */

  try {

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [{ parts: [{ text: systemPrompt }] }],
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

    if (!text) return { error: "AI ไม่ส่งข้อมูลกลับมา" };

    const parsed = JSON.parse(text);

    if (ie_ratio <= 1) {
      parsed.actions = parsed.actions || [];
      parsed.actions.push(
        "ควรพิจารณาหาแหล่งรายได้เพิ่มเติมเพื่อให้ I/E ratio มากกว่า 1"
      );
    }

    return parsed;

  } catch (error) {

    console.error(error.response?.data || error.message);

    return {
      error: "ไม่สามารถเชื่อมต่อ AI ได้ กรุณาลองใหม่อีกครั้งค่ะ",
    };
  }
}

module.exports = { generateFinancialAdvice };