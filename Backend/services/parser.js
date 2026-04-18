function transformSPayLater(data) {
  const normalize = (val) => String(val || "").trim();

  const outstandingMap = Object.fromEntries(
    (data.outstandingDetails || []).map((o) => [
      normalize(o.referenceNo),
      o.amount,
    ])
  );

  console.log("===== TRANSFORM MAP =====");
  console.log(outstandingMap);

  return (data.loanDueDetails || []).map((loan) => {
    const loanRef = normalize(loan.referenceNo);


    const transformed = {
      productName: loan.referenceNo,
      purchaseDate: loan.date,
      dueDate: data.dueDate,

      totalDebt:((loan.monthlyInstallment ?? loan.totalDue) * (loan.totalInstallments || 1)),
      annualInterestRate: loan.annualInterestRate,
      totalInstallments: loan.totalInstallments || 1,
      monthlyInstallment: loan.totalDue,
      outstandingDebt: outstandingMap[loanRef] ?? 0,
    };

    console.log("TRANSFORMED:", transformed);

    return transformed;
  });
}

function parseLoanData(rows) {
  let fullText = rows.join("\n");

  fullText = fullText
    .replace(/\r/g, "")
    .replace(/\n\s*%\s*/g, "%")
    .replace(/(\d+)\s*\.\s*(\d+)/g, "$1.$2");

  fullText = fullText.split(
    /Payment\s*of\s*the\s*previous\s*Billing\s*Statement/i
  )[0];

  const monthMap = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };

  const loanDueDetails = [];
  let outstandingDetails = [];

  // ================= DATE HEADER =================
  const dateMatches = fullText.match(/\d{1,2}\/\d{1,2}\/\d{4}/g);
  const dueDate = dateMatches?.at(-1) || null;

  console.log("===== DUE DATE =====", dueDate);

  // ================= INTEREST =================
  const rateMatch = fullText.match(/([\d]+(?:\.\d+)?)\s*%/);
  const annualInterestRate = rateMatch
    ? Number(rateMatch[1])
    : 25;

  console.log("===== INTEREST =====", annualInterestRate);

  // ================= DUE SECTION =================
  let dueSection =
    fullText.match(/Loan Due Details[\s\S]*?(?=Outstanding|ยอดหนี้คงเหลือ)/i)?.[0];

  console.log("===== DUE SECTION =====");
  console.log(dueSection);

  if (dueSection) {
    const refs = [...dueSection.matchAll(/\b\d{18,22}\b/g)];

    console.log("===== REFS FOUND =====");
    console.log(refs.map(r => r[0]));

    refs.forEach((refMatch, index) => {
      const ref = refMatch[0];
      const refIndex = refMatch.index;

      const end =
        index < refs.length - 1
          ? refs[index + 1].index
          : dueSection.length;

      const block = dueSection.slice(refIndex, end);

      const beforeRef = dueSection.slice(
        Math.max(0, refIndex - 120),
        refIndex
      );

      console.log("------ BLOCK START ------");
      console.log("REF:", ref);
      console.log("BLOCK:", block);
      console.log("BEFORE REF:", beforeRef);

      // ================= TOTAL =================
      const nums =
        beforeRef.match(/\d{1,3}(?:,\d{3})*\.\d{2}/g) || [];

      const totalDue = nums.length
        ? parseFloat(nums.at(-1).replace(/,/g, ""))
        : 0;

      console.log("SELECTED TOTAL:", totalDue);

      // ================= INSTALLMENT =================
      const installmentMatch = block.match(/\((\d+)\s*\/\s*(\d+)\)/);

      const totalInstallments = installmentMatch
        ? parseInt(installmentMatch[2], 10)
        : 1;

      // ================= DATE FIX =================
      const dateRegex =
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g;

      const dateMatchesAll = [...beforeRef.matchAll(dateRegex)];

      console.log("ALL DATE MATCHES:", dateMatchesAll.map(m => m[0]));

      const dateMatch =
        dateMatchesAll.length
          ? dateMatchesAll[dateMatchesAll.length - 1]
          : null;

      let formattedDate = null;

      if (dateMatch) {
        const day = dateMatch[1].padStart(2, "0");
        const month = monthMap[dateMatch[2]];

        const afterRef = dueSection.slice(refIndex, refIndex + 200);
        const yearMatch = afterRef.match(/(20\d{2})/);

        const year = yearMatch ? yearMatch[1] : "2026";

        formattedDate = `${day}/${month}/${year}`;
      }

      console.log("SELECTED DATE:", formattedDate);

      // ✅ PUSH DATA
      loanDueDetails.push({
        date: formattedDate,
        referenceNo: ref,
        totalDue,
        totalInstallments,
        annualInterestRate,
      });

      console.log("------ BLOCK END ------\n");
      
    });
  }

  // ================= OUTSTANDING =================
  let outstandingSection =
    fullText.match(/Outstanding[\s\S]*$/i)?.[0] ||
    fullText.match(/ยอดหนี้คงเหลือ[\s\S]*$/i)?.[0];

  console.log("===== OUTSTANDING SECTION =====");
  console.log(outstandingSection);

  if (outstandingSection) {
    const refs = [...outstandingSection.matchAll(/\b\d{18,22}\b/g)]
      .map((m) => m[0]);

    const nums =
      outstandingSection.match(/\d{1,3}(?:,\d{3})*\.\d{2}/g) || [];

    const cleanNums = nums.map(n =>
      parseFloat(n.replace(/,/g, ""))
    );

    let extracted = [];

    for (let i = 0; i < cleanNums.length - 1; i++) {
      if (cleanNums[i + 1] > cleanNums[i]) {
        extracted.push(cleanNums[i + 1]);
        i++;
      }
    }

    if (extracted.length > refs.length) {
      extracted.pop();
    }

    console.log("FINAL OUTSTANDING:", extracted);

    refs.forEach((ref, i) => {
      if (extracted[i] !== undefined) {
        outstandingDetails.push({
          referenceNo: ref,
          amount: extracted[i],
        });
      }
    });
  }

  console.log("===== FINAL OUTPUT =====");
  console.log({
    dueDate,
    loanDueDetails,
    outstandingDetails,
  });

  return {
    dueDate,
    loanDueDetails,
    outstandingDetails,
    contracts: transformSPayLater({
      dueDate,
      loanDueDetails,
      outstandingDetails,
    }),
  };
}

module.exports = parseLoanData;