function transformSPayLater(data) {
  const normalize = (val) => String(val || "").trim();

  // ✅ สร้าง map ไว้ match เร็ว + ชัวร์
  const outstandingMap = Object.fromEntries(
    (data.outstandingDetails || []).map((o) => [
      normalize(o.referenceNo),
      o.amount,
    ])
  );

  return (data.loanDueDetails || []).map((loan) => {
    const loanRef = normalize(loan.referenceNo);

    return {
      productName: loan.referenceNo,
      purchaseDate: loan.date,
      dueDate: data.dueDate,

      totalDebt: loan.totalDue * loan.totalInstallments,
      annualInterestRate: loan.annualInterestRate,
      totalInstallments: loan.totalInstallments,
      monthlyInstallment: loan.totalDue,

      // ✅ ดึงค่าได้แน่นอน
      outstandingDebt: outstandingMap[loanRef] ?? 0,
    };
  });
}function transformSPayLater(data) {
  const normalize = (val) => String(val || "").trim();

  // ✅ สร้าง map ไว้ match เร็ว + ชัวร์
  const outstandingMap = Object.fromEntries(
    (data.outstandingDetails || []).map((o) => [
      normalize(o.referenceNo),
      o.amount,
    ])
  );

  return (data.loanDueDetails || []).map((loan) => {
    const loanRef = normalize(loan.referenceNo);

    return {
      productName: loan.referenceNo,
      purchaseDate: loan.date,
      dueDate: data.dueDate,

      totalDebt: loan.totalDue * loan.totalInstallments,
      annualInterestRate: loan.annualInterestRate,
      totalInstallments: loan.totalInstallments,
      monthlyInstallment: loan.totalDue,

      // ✅ ดึงค่าได้แน่นอน
      outstandingDebt: outstandingMap[loanRef] ?? 0,
    };
  });
}

function parseLoanData(rows) {
  let fullText = rows.join("\n");

  // ================= CLEAN TEXT =================
  fullText = fullText
    .replace(/\r/g, "")
    .replace(/\n\s*%\s*/g, "%")
    .replace(/(\d+)\s*\.\s*(\d+)/g, "$1.$2")
    .replace(/(\d{1,3}(?:,\d{3})*)\s*\.\s*(\d{2})\s*บาท/g, "$1.$2 บาท")
    .replace(/\b0\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g, "10 $1");

  fullText = fullText.split(
    /Payment\s*of\s*the\s*previous\s*Billing\s*Statement/i
  )[0];

  const loanType =
    fullText.match(/SPayLater by SeaMoney/i)?.[0] || null;

  const loanNoMatches = fullText.match(/SPL\d{10,}/g);
  const loanNo = loanNoMatches ? loanNoMatches.at(-1) : null;

  // ================= MONTH MAP =================
  const monthMap = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  // ================= HEADER DATE (FIX FORMAT) =================
  function normalizeDateDMY(dateStr) {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return dateStr;

    let [first, second, year] = parts;

    // PDF เป็น MM/DD/YYYY → แปลงเป็น DD/MM/YYYY
    const day = second.padStart(2, "0");
    const month = first.padStart(2, "0");

    return `${day}/${month}/${year}`;
  }

  const dateMatches = fullText.match(/\d{1,2}\/\d{1,2}\/\d{4}/g);

  const statementDate = dateMatches?.at(-2)
    ? normalizeDateDMY(dateMatches.at(-2))
    : null;

  const dueDate = dateMatches?.at(-1)
    ? normalizeDateDMY(dateMatches.at(-1))
    : null;

  // ================= INTEREST RATE =================
  let annualInterestRate = null;

  const rateMatch =
    fullText.match(/อัตรา\s*ดอกเบี้ย[^0-9]*([\d]+(?:\.\d+)?)\s*%/i) ||
    fullText.match(/([\d]+(?:\.\d+)?)\s*%\s*(ต่อปี|per\s*year)?/i);

  if (rateMatch) {
    annualInterestRate = Number(rateMatch[1]);
  }

  const loanDueDetails = [];
  let outstandingDetails = [];

  // ================= LOAN DUE DETAILS =================
  const dueSection = fullText
    .split(/Loan\s*Due\s*Details/i)[1]
    ?.split(/Outstanding\s*Balance|ยอดหนี้คงเหลือ/i)[0];

  if (dueSection) {
    const blocks = dueSection
      .split(/(?=^\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/gm)
      .filter((b) => b.trim());

    blocks.forEach((block) => {
      const dateMatch = block.match(
        /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/m
      );
      if (!dateMatch) return;

      const day = dateMatch[1].padStart(2, "0");
      const month = monthMap[dateMatch[2]];
      const year = dateMatch[3];

      const formattedDate = `${month}/${day}/${year}`;

      const amounts =
        block.match(/\d{1,3}(?:,\d{3})*\.\d{2}/g) || [];
      if (amounts.length < 6) return;

      const refMatch = block.match(/\b\d{18,22}\b/);
      const instMatch = block.match(/\((\d+)\/(\d+)\)/);

      loanDueDetails.push({
        date: formattedDate,
        description: "SPayLater Installment",
        referenceNo: refMatch ? refMatch[0] : null,
        installmentNo: instMatch ? Number(instMatch[1]) : null,
        totalInstallments: instMatch ? Number(instMatch[2]) : null,
        annualInterestRate,
        principal: parseFloat(amounts[0].replace(/,/g, "")),
        interest: parseFloat(amounts[1].replace(/,/g, "")),
        debtFee: parseFloat(amounts[2].replace(/,/g, "")),
        stampDuty: parseFloat(amounts[3].replace(/,/g, "")),
        others: parseFloat(amounts[4].replace(/,/g, "")),
        totalDue: parseFloat(amounts[5].replace(/,/g, "")),
      });
    });
  }

  // ================= OUTSTANDING BALANCE (PAIR LOGIC FIX) =================

// 1. section
let outstandingSection = null;

const match = fullText.match(/Outstanding[\s\S]*$/i);
if (match) {
  outstandingSection = match[0];
} else {
  const thMatch = fullText.match(/ยอดหนี้คงเหลือ[\s\S]*$/i);
  outstandingSection = thMatch ? thMatch[0] : null;
}

if (outstandingSection) {

  // 2. refs
  const refs = [...outstandingSection.matchAll(/\b\d{18,22}\b/g)]
    .map(m => m[0]);

  console.log("REFS:", refs);

  // 3. numbers
  const nums = outstandingSection.match(/\d{1,3}(?:,\d{3})*(?:\.\d{1,2})/g) || [];
  const cleanNums = nums.map(n => parseFloat(n.replace(/,/g, "")));

  console.log("ALL NUMS:", cleanNums);

  // 🔥 4. ใช้ pair logic
  let extracted = [];

  for (let i = 0; i < cleanNums.length - 1; i++) {
    const current = cleanNums[i];
    const next = cleanNums[i + 1];

    // ถ้าค่าถัดไปมากกว่า → คือ total
    if (next > current) {
      extracted.push(next);
      i++; // ข้ามคู่
    }
  }

  console.log("PAIR PICK:", extracted);

  // 🔥 5. ตัด grand total (ตัวสุดท้าย)
  if (extracted.length > refs.length) {
    extracted.pop();
  }

  console.log("FINAL AMOUNTS:", extracted);

  // 6. map
  refs.forEach((ref, i) => {
    if (extracted[i] !== undefined) {
      outstandingDetails.push({
        referenceNo: ref,
        amount: extracted[i]
      });
    }
  });
}

console.log("✅ FINAL:", outstandingDetails);


  const result = {
    loanType,
    loanNo,
    statementDate,
    dueDate,
    loanDueDetails,
    outstandingDetails,
  };

  const contracts = transformSPayLater(result);

  return {
    ...result,
    contracts,
  };
}

module.exports = parseLoanData;