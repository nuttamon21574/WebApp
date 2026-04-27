import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import MonthPicker from "../components/Button/MonthPicker.jsx";
import Statinfo from "../components/Card/Statinfo.jsx";

import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Recommendations() {

  // =============================
  // 📅 CURRENT MONTH
  // =============================
  const getCurrentMonth = () => {
    const now = new Date();
    const thai = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );

    return `${thai.getFullYear()}-${String(
      thai.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  // =============================
  // 📅 START MONTH (from Firebase Auth)
  // =============================
  const getStartMonthFromUser = (user) => {
    if (!user?.metadata?.creationTime) return null;

    const date = new Date(user.metadata.creationTime);

    const thai = new Date(
      date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );

    return `${thai.getFullYear()}-${String(
      thai.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [advice, setAdvice] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusType, setStatusType] = useState("normal");

  // =============================
  // 🔐 AUTH
  // =============================
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // =============================
  // 📡 FETCH
  // =============================
  useEffect(() => {
    if (!user || !selectedMonth) return;

    let isMounted = true;

    const fetchRecommendation = async () => {
      try {
        if (loading) return;

        setLoading(true);

        const currentMonth = getCurrentMonth();
        const startMonth = getStartMonthFromUser(user);

        if (!startMonth) return;

        // ⛔ ก่อนสมัคร
        if (selectedMonth < startMonth) {
          setAdvice(null);
          setStatusType("beforeStart");
          return;
        }

        // ⛔ เดือนอนาคต
        if (selectedMonth > currentMonth) {
          setAdvice(null);
          setStatusType("future");
          return;
        }

        const docRef = doc(
          db,
          "recommendation",
          user.uid,
          "monthly",
          selectedMonth
        );

        // =============================
        // ⚡ CACHE ก่อน
        // =============================
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          console.log("⚡ USE CACHE");

          const raw = snap.data();

          const normalized = {
            ...raw,
            recommended_payment: Number(raw.recommended_payment || 0),
            remaining_monthly_cash: Number(raw.remaining_monthly_cash || 0),
            actions: raw.actions || [],
            benefits: raw.benefits || [],
          };

          const isAllZero =
            normalized.recommended_payment === 0 &&
            normalized.remaining_monthly_cash === 0 &&
            normalized.actions.length === 0 &&
            normalized.benefits.length === 0;

          setAdvice(isAllZero ? null : normalized);
          setStatusType(isAllZero ? "noDebt" : "normal");
          return;
        }

        // =============================
        // 🚀 GENERATE (ใช้ API เดิม)
        // =============================
        console.log("🆕 GENERATE");

        const API_URL = "https://webapp-osky.onrender.com";

        await fetch(`${API_URL}/api/financial`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid }),
        });

        await fetch(`${API_URL}/api/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            month: selectedMonth,
          }),
        });

        const newSnap = await getDoc(docRef);

        if (!isMounted) return;

        if (newSnap.exists()) {
          const raw = newSnap.data();

          const normalized = {
            ...raw,
            recommended_payment: Number(raw.recommended_payment || 0),
            remaining_monthly_cash: Number(raw.remaining_monthly_cash || 0),
            actions: raw.actions || [],
            benefits: raw.benefits || [],
          };

          const isAllZero =
            normalized.recommended_payment === 0 &&
            normalized.remaining_monthly_cash === 0 &&
            normalized.actions.length === 0 &&
            normalized.benefits.length === 0;

          setAdvice(isAllZero ? null : normalized);
          setStatusType(isAllZero ? "noDebt" : "normal");
        } else {
          setAdvice(null);
        }

      } catch (err) {
        console.error("🔥 FETCH ERROR:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecommendation();

    return () => {
      isMounted = false;
    };

  }, [selectedMonth, user]);

  // =============================
  // 🎨 UI
  // =============================
  return (
    <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-10 py-6">

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 h-full">

        <Sidebar activeTab="Recommendations" />

        <div className="flex flex-col mt-6 lg:mt-0">

          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-50">
            Recommendation
          </p>

          <div className="mt-4 mb-6">
            <MonthPicker
              value={selectedMonth}
              onChange={(val) => {
                setSelectedMonth(val);
              }}
            />
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 w-full shadow-md min-h-[400px]">

            {loading && (
              <p className="text-gray-500 text-center">
                Loading...
              </p>
            )}

            {!loading && (
              <Statinfo
                key={selectedMonth}
                advice={advice}
                statusType={statusType}
              />
            )}

          </div>

        </div>

      </div>

    </div>
  );
}