import { useEffect } from "react";
import BNPLTabs from "./BNPLTabs";
import BNPLDetailRow from "./BNPLDetailRow";


export default function BNPLDashboard({
  form = {},              // ✅ กัน undefined
  onShowAdd,
  activeTab,
  onChangeTab,
}) {
  const showStatus = true;

  // ให้ปุ่ม + แสดงทันทีเมื่อเข้า Dashboard
  useEffect(() => {
    onShowAdd?.(true);
    return () => onShowAdd?.(false);
  }, [onShowAdd]);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 w-full h-full flex flex-col gap-8">
      {/* Tabs */}
      <BNPLTabs activeTab={activeTab} onChange={onChangeTab} />

      {/* Summary */}
      <div className="flex justify-center w-full">
        <div
          className={`grid gap-8 w-full max-w-4xl ${
            showStatus ? "md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* Outstanding Balance */}
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-sm text-gray-500 mb-3">
              Outstanding Balance
            </p>
            <p className="text-3xl font-semibold">
              {form?.total ?? "2500"}
            </p>
          </div>

          {/* Status */}
          {showStatus && (
            <div className="bg-green-400 rounded-2xl p-8 text-white flex flex-col items-center justify-center">
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-green-500 text-xl font-bold mb-3">
                ✓
              </div>
              <p className="text-sm font-medium">Non-Default</p>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-y-6 gap-x-16 text-sm">
        <BNPLDetailRow label="Total Due Amount" value={form?.total ?? "-"} />
        <BNPLDetailRow label="Interest" value={form?.interest ?? "-"} />
        <BNPLDetailRow label="Monthly Payment" value={form?.monthlyPayment ?? "-"} />
        <BNPLDetailRow label="Payment Due Date" value={form?.dueDate ?? "-"} />
      </div>
    </div>
  );
}
