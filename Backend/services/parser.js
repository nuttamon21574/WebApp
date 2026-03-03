function transformSPayLater(data) {
  return data.loanDueDetails.map((loan) => {
    const outstanding = data.outstandingDetails.find((o) => {
      if (!o.referenceNo || !loan.referenceNo) return false;
      return o.referenceNo.slice(-10) === loan.referenceNo.slice(-10);
    });

    return {
      productName: loan.referenceNo,
      purchaseDate: loan.date, // dd/MM/yyyy อยู่แล้ว
      dueDate: data.dueDate,   // ✅ ส่ง dueDate ไป frontend
      totalDebt: loan.totalDue * loan.totalInstallments,
      annualInterestRate: loan.annualInterestRate,
      totalInstallments: loan.totalInstallments,
      monthlyInstallment: loan.totalDue,
      outstandingDebt: outstanding?.amount ?? 0,
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
  const outstandingDetails = [];

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

  // ================= OUTSTANDING BALANCE (FIXED VERSION) =================
  const outstandingSection = fullText.split(/Outstanding\s*Balance|ยอดหนี้คงเหลือ/i)[1];

  if (outstandingSection) {
    // 1. ดึง Reference No. ทั้งหมด (20xxxxxxxxxxxxxxxxxxx)
    const allRefs = [];
    const refPattern = /\b20\d{17,19}\b/g;
    let refMatch;
    while ((refMatch = refPattern.exec(outstandingSection)) !== null) {
      allRefs.push({ val: refMatch[0], index: refMatch.index });
    }

    // 2. ดึง "ยอดรวม" (Total Amount) ทั้งหมด (ตัวเลขที่มี .xx และมักจะอยู่ท้ายแถวหรือใกล้เลขสัญญา)
    const allAmounts = [];
    const amountPattern = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
    let amtMatch;
    while ((amtMatch = amountPattern.exec(outstandingSection)) !== null) {
      allAmounts.push({ val: parseFloat(amtMatch[0].replace(/,/g, "")), index: amtMatch.index });
    }

    // 3. จับคู่ (Mapping): สำหรับแต่ละ Ref ให้หา Amount ที่อยู่ "ใกล้" มันที่สุด 
    allRefs.forEach(ref => {
      let closestAmount = null;
      let minDistance = Infinity;

      allAmounts.forEach(amt => {
        const distance = Math.abs(ref.index - amt.index);
        if (distance < minDistance) {
          minDistance = distance;
          closestAmount = amt.val;
        }
      });

      if (closestAmount !== null) {
        outstandingDetails.push({
          referenceNo: ref.val,
          amount: closestAmount
        });
      }
    });
  }

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