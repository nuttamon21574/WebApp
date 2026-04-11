function validLoanRollover(data) {
  const balance = Number(data.balance || 0);
  const totalInstallment = Number(data.total_installment || 0);

  if (balance >= totalInstallment) return false;

  const spayInstallment = Number(data.spaylater_monthly_installment || 0);
  const lazInstallment = Number(data.lazpaylater_monthly_installment || 0);

  const spayTerm = Number(data.spaylater_selected_terms || 0);
  const lazTerm = Number(data.lazpaylater_selected_terms || 0);

  const canPaySpay = balance >= spayInstallment && spayInstallment > 0;
  const canPayLaz = balance >= lazInstallment && lazInstallment > 0;

  const casePayOne =
    (canPaySpay && lazTerm === 1) ||
    (canPayLaz && spayTerm === 1);

  const caseRollBoth =
    !canPaySpay &&
    !canPayLaz &&
    spayTerm === 1 &&
    lazTerm === 1;

  return casePayOne || caseRollBoth;
}

function assignPersona(data) {
  const balance = Number(data.balance || 0);
  const totalDebt = Number(data.total_debt || 0);
  const totalInstallment = Number(data.total_installment || 0);

  console.log("===== PERSONA DEBUG =====");
  console.log("Balance:", balance);
  console.log("Total Debt:", totalDebt);
  console.log("Total Installment:", totalInstallment);

  // 1️⃣ ปิดหนี้ได้ทั้งหมด
  if (balance >= totalDebt && totalDebt > 0) {
    return "Full Clearance";
  }

  // 2️⃣ จ่ายมากกว่าขั้นต่ำได้
  if (balance > totalInstallment) {
    return "Can Prepay";
  }

  // 3️⃣ จ่ายขั้นต่ำพอดี
  if (balance === totalInstallment) {
    return "Can Pay Minimum";
  }

  // 4️⃣ ต้อง rollover
  if (validLoanRollover(data)) {
    return "Loan Rollover";
  }

  // 5️⃣ ❗ ใหม่: จ่ายไม่ได้เลย
  if (balance < totalInstallment) {
    return "Unable to Pay";
  }

  return null;
}

module.exports = { assignPersona };