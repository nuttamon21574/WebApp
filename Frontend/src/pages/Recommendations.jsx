import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import MonthPicker from "../components/Button/MonthPicker.jsx";
import Statinfo from "../components/Card/Statinfo.jsx";

import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

import loadImg from "@/assets/image/load.gif";

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
        //if (loading) return;

        setLoading(true);

        const currentMonth = getCurrentMonth();
        const isCurrentMonth = selectedMonth === currentMonth;
        const startMonth = getStartMonthFromUser(user);

        if (!startMonth) return;

        // ⛔ BEFORE REGISTER
        if (selectedMonth < startMonth) {
          console.log("⛔ BEFORE REGISTER");
          setAdvice(null);
          setStatusType("beforeStart");
          return;
        }

        // ⛔ FUTURE
        if (selectedMonth > currentMonth) {
          console.log("⛔ FUTURE");
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
        // ⚡ USE CACHE
        // =============================
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          console.log("⚡ USE CACHED DATA");

          const raw = snap.data();

          const normalized = {
            ...raw,
            recommended_payment: Number(raw.recommended_payment || 0),
            remaining_monthly_cash: Number(raw.remaining_monthly_cash || 0),
            actions: raw.actions || [],
            benefits: raw.benefits || [],
          };

          const isFallback = raw.is_fallback === true;


          const isAllZero =
            normalized.recommended_payment === 0 &&
            normalized.remaining_monthly_cash === 0 &&
            normalized.actions.length === 0 &&
            normalized.benefits.length === 0;

          if (isFallback) {
            setAdvice(raw); // ไม่ต้อง normalize ทับ
            setStatusType("fallback");
          }
          else if (isAllZero) {
            setAdvice(null);
            setStatusType("noDebt");
          }
          else {
            setAdvice(normalized);
            setStatusType("normal");
          }
          //return;
          if (!isCurrentMonth) {
            return;
          }
        }

        // =============================
        // 🚀 GENERATE
        // =============================
        if (!isCurrentMonth) {
          console.log("⛔ SKIP GENERATE (NOT CURRENT MONTH)");
          return;
        }

        console.log("🆕 GENERATE");

        await fetch("http://localhost:5000/api/financial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid }),
        });

        await fetch("http://localhost:5000/api/ai", {
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

        const isFallback = raw.is_fallback === true;

        const isAllZero =
          normalized.recommended_payment === 0 &&
          normalized.remaining_monthly_cash === 0 &&
          normalized.actions.length === 0 &&
          normalized.benefits.length === 0;

        if (isFallback) {
          setAdvice(raw);
          setStatusType("fallback");
        } else if (isAllZero) {
          setAdvice(null);
          setStatusType("noDebt");
        } else {
          setAdvice(normalized);
          setStatusType("normal");
        }
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

          {/* Month Picker */}
          <div className="mt-4 mb-6">
            <MonthPicker
              value={selectedMonth}
              onChange={(val) => {
                console.log("📅 CHANGE MONTH:", val);
                setSelectedMonth(val);
              }}
            />
          </div>

          {/* CONTENT */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 w-full shadow-md h-full">

            {loading && (
              <div className="flex flex-col justify-center items-center h-full text-center gap-3">
                <img
                  src={loadImg}
                  alt="loading"
                  className="w-50 h-50 object-contain"
                />

                <p className="text-gray-400 text-sm animate-pulse">
                  กำลังวิเคราะห์ข้อมูล...
                </p>
              </div>
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