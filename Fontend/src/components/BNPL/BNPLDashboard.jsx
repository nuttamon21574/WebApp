import { useEffect, useState } from "react";
import BNPLTabs from "./BNPLTabs";
import BNPLDetailRow from "./BNPLDetailRow";

import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function BNPLDashboard({
  onShowAdd,
  activeTab,
  onChangeTab,
}) {
  const [data, setData] = useState(null);

  const showStatus = activeTab === "Total BNPL";

  /* ================= show add button ================= */
  useEffect(() => {
    onShowAdd?.(true);
    return () => onShowAdd?.(false);
  }, [onShowAdd]);

  /* ================= load manualDebt ================= */
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, "bnplDebt", user.uid));
        if (snap.exists()) {
          setData(snap.data());
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };

    load();
  }, []);

  const d = data || {};

  /* ================= UI ================= */
  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 w-full h-full flex flex-col gap-8">

      <BNPLTabs activeTab={activeTab} onChange={onChangeTab} />

      {/* ===== Summary ===== */}
      <div className="flex justify-center w-full">
        <div
          className={`grid gap-8 w-full max-w-4xl ${
            showStatus ? "md:grid-cols-2" : "grid-cols-1"
          }`}
        >

          {/* Outstanding Balance */}
          <div className="bg-white rounded-2xl shadow-md p-8 text-center h-[170px] flex flex-col justify-center">
            <p className="text-sm text-gray-500 mb-3">
              Outstanding Balance
            </p>

            <p className="text-3xl font-semibold">
              {d.outstandingBalance ?? "-"}
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

      {/* ===== Details ===== */}
      <div className="grid md:grid-cols-2 gap-y-6 gap-x-16 text-sm">
        <BNPLDetailRow label="Total Debt" value={d.totalDebt ?? "-"} />
        <BNPLDetailRow label="Interest" value={d.interest ?? "-"} />
        <BNPLDetailRow label="Monthly Payment" value={d.monthlyPayment ?? "-"} />
        <BNPLDetailRow label="Installments" value={d.installments ?? "-"} />
        <BNPLDetailRow label="Due Date" value={d.dueDate ?? "-"} />
      </div>

    </div>
  );
}
