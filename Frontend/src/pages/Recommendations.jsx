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

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [advice, setAdvice] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  

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
        setLoading(true);

        const docRef = doc(
          db,
          "recommendation",
          user.uid,
          "monthly",
          selectedMonth
        );

        const snap = await getDoc(docRef);

        if (!isMounted) return;

        if (snap.exists()) {
        console.log("✅ FOUND DATA:", selectedMonth);

        const raw = snap.data();

        const normalized = {
          ...raw,
          recommended_payment: Number(raw.recommended_payment || 0),
          remaining_monthly_cash: Number(raw.remaining_monthly_cash || 0),
          actions: raw.actions || [],
          benefits: raw.benefits || [],
        };

        setAdvice(normalized);

      } else {
        console.warn("⚠️ NO DATA → GENERATE AI:", selectedMonth);

        setAdvice(null); // ให้ UI เคลียร์ก่อน
        
        // 🔥 เรียก AI
        try {
        console.log("📤 CALL AI API:", {
          uid: user.uid,
          month: selectedMonth,
        });

        const res = await fetch("http://localhost:5000/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: user.uid,
            month: selectedMonth,
          }),
        });

        const data = await res.json();

        console.log("🎉 AI RESPONSE:", data);

        // 🔁 fetch ใหม่หลัง generate
        const newSnap = await getDoc(docRef);

        if (newSnap.exists()) {
          console.log("✅ REFETCH SUCCESS");

          const raw = newSnap.data();

          setAdvice({
            ...raw,
            recommended_payment: Number(raw.recommended_payment || 0),
            remaining_monthly_cash: Number(raw.remaining_monthly_cash || 0),
            actions: raw.actions || [],
            benefits: raw.benefits || [],
          });

        } else {
          console.error("❌ AI SAVE FAILED (no monthly doc)");
        }

      } catch (err) {
        console.error("🔥 AI CALL ERROR:", err);
      }
      }

      } catch (err) {
        console.error(err);
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 w-full shadow-md min-h-[400px]">

            {/* 🔄 Loading */}
            {loading && (
              <p className="text-gray-500 text-center">
                Loading...
              </p>
            )}

            {/* ✅ ใช้ Statinfo ตลอด */}
            {!loading && (
              <Statinfo
                key={selectedMonth}
                advice={advice}
              />
            )}

          </div>

        </div>

      </div>

    </div>
  );
}