import SaveButton from "../Button/SaveButton";

export default function CheckBNPL({ contracts = [], onSave }) {
  
  // ฟังก์ชันช่วยจัดรูปแบบตัวเลข (1,000.00)
  const formatValue = (val, isBaht) => {
    if (isBaht && typeof val === "number") {
      return val.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    return val ?? "-";
  };

  const Field = ({ label, value, isBaht }) => (
    <>
      <label className="md:col-span-4 font-medium text-gray-800 flex items-center min-h-[40px]">
        {label}
      </label>

      <div className="md:col-span-8 bg-gray-100 rounded-lg px-4 py-2
                     text-gray-800 flex justify-between items-center min-h-[40px]">
        <span className="truncate font-mono">{formatValue(value, isBaht)}</span>
        {isBaht && (
          <span className="ml-2 text-gray-500 text-xs uppercase">Baht</span>
        )}
      </div>
    </>
  );

  return (
    <div className="w-full space-y-8">
      {/* วนลูปแสดงแต่ละสัญญา (Contract) */}
      {contracts.map((contract, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 md:px-10"
        >
          {/* Header สินค้า */}
          <div className="mb-6 flex items-center gap-3">
            <div className="w-2 h-8 bg-purple-600 rounded-full"></div>
            <h2 className="text-lg font-semibold text-purple-700">
              {contract.productName || `Contract #${index + 1}`}
            </h2>
          </div>

          {/* รายละเอียด */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-4 gap-x-8 items-center text-sm">
            <Field label="Total Debt" value={contract.totalDebt} isBaht />
            <Field label="Outstanding Balance" value={contract.outstandingDebt} isBaht />
            <Field label="Monthly Payment" value={contract.monthlyInstallment} isBaht />
            <Field label="Total Installments" value={contract.totalInstallments} />
            <Field label="Interest Rate" value={`${contract.annualInterestRate || 0}%`} />
            <Field label="Payment Date" value={contract.purchaseDate} />
          </div>
        </div>
      ))}

      {/* ปุ่ม Save ด้านล่างสุด */}
      <div className="flex justify-center pt-4">
        <SaveButton isComplete={true} onClick={onSave} />
      </div>
    </div>
  );
}