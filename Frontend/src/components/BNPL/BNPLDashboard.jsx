import { useEffect, useState } from "react";
import BNPLTabs from "./BNPLTabs";
import BNPLDetailRow from "./BNPLDetailRow";
import RiskTier from "../Card/Risk_tier.jsx";


import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function BNPLDashboard({
  onShowAdd,
  activeTab,
  onChangeTab,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [riskTier, setRiskTier] = useState("null");

  


  const isTotal = activeTab === "Total BNPL";

  useEffect(() => {
    onShowAdd?.(true);
    return () => onShowAdd?.(false);
  }, [onShowAdd]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setData(null);
        setLoading(false);
        return;
      }

      try {
        const getProviderSummary = async (providerName) => {
          const ref = doc(
            db,
            "bnplDebt",
            user.uid,
            "providers",
            providerName
          );

          const snap = await getDoc(ref);
          if (!snap.exists()) return null;

          const d = snap.data();
          const isSpay = providerName === "SPayLater";

          return {
            outstandingBalance: d.provider_outstanding || 0,
            totalDebt: d.provider_original_debt || 0,
            totalLimit: isSpay
              ? user.spaylater_limit || 0
              : user.lazpaylater_limit || 0,
            monthlyPayment: d.provider_monthly || 0,
            installments: d.provider_remaining_installments || 0,
          };
        };

        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        setRiskTier(userData.risk_tier || "null");

        if (!isTotal) {
          const providerData = await getProviderSummary(activeTab);

          if (!providerData) {
            setData(null);
          } else {
            setData({
              ...providerData,
              creditUtilization:
                providerData.totalLimit > 0
                  ? ((providerData.outstandingBalance / providerData.totalLimit)).toFixed(2)
                  : "-",
            });
          }
        }

        if (isTotal) {
          const spayRef = doc(
            db,
            "bnplDebt",
            user.uid,
            "providers",
            "SPayLater"
          );

          const lazRef = doc(
            db,
            "bnplDebt",
            user.uid,
            "providers",
            "LazPayLater"
          );

          const [spaySnap, lazSnap] = await Promise.all([
            getDoc(spayRef),
            getDoc(lazRef),
          ]);

          const spay = spaySnap.exists() ? spaySnap.data() : {};
          const laz = lazSnap.exists() ? lazSnap.data() : {};

          const totalOutstanding =
            (spay.provider_outstanding || 0) +
            (laz.provider_outstanding || 0);

          const totalMonthly =
            (spay.provider_monthly || 0) +
            (laz.provider_monthly || 0);

          const totalDebt =
            (spay.provider_original_debt || 0) +
            (laz.provider_original_debt || 0);

          const activeLimit =
            (spay.provider_outstanding > 0
              ? userData.spaylater_limit || 0
              : 0) +
            (laz.provider_outstanding > 0
              ? userData.lazpaylater_limit || 0
              : 0);

          const utilization =
            activeLimit > 0
              ? ((totalOutstanding / activeLimit)).toFixed(2)
              : "-";

          setData({
            outstandingBalance: totalOutstanding,
            totalDebt: totalDebt,
            monthlyPayment: totalMonthly,
            creditUtilization: utilization,
            platformCount:
              (spay.provider_outstanding > 0 ? 1 : 0) +
              (laz.provider_outstanding > 0 ? 1 : 0),
          });
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        setData(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-900 mb-4"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const d = data || {};

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 w-full h-full flex flex-col gap-8">
      <BNPLTabs activeTab={activeTab} onChange={onChangeTab} />

      <div className="flex justify-center w-full">
        <div
          className={`grid gap-8 w-full max-w-4xl ${
            isTotal ? "md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-md p-8 text-center h-[170px] flex flex-col justify-center border border-gray-100">
            <p className="text-sm text-gray-500 mb-3">
              Outstanding Balance
            </p>
            <p className="text-3xl font-semibold text-purple-900">
              {d.outstandingBalance ?? "-"}
            </p>
          </div>

          {isTotal && (
            <RiskTier riskTier={riskTier} />
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-y-6 gap-x-16 text-sm border-t border-gray-50 pt-8">
        {/* <BNPLDetailRow label="Total Debt" value={d.totalDebt ?? "-"} /> */}

        {isTotal ? (
          <>
            <BNPLDetailRow
              label="Credit Utilization"
              value={
                d.creditUtilization !== "-"
                  ? `${d.creditUtilization}`
                  : "-"
              }
            />
            <BNPLDetailRow
              label="Monthly Payment"
              value={d.monthlyPayment ?? "-"}
            />
            <BNPLDetailRow
              label="Platform Count"
              value={d.platformCount ?? "-"}
            />
          </>
        ) : (
          <>
            <BNPLDetailRow
              label="Monthly Payment"
              value={d.monthlyPayment ?? "-"}
            />
            <BNPLDetailRow
              label="Installments"
              value={d.installments ?? "-"}
            />
          </>
        )}
      </div>
    </div>
  );
}