import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";
import { db, auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

import fullClearanceImg from "@/assets/image/FullClearance.png";
import loanImg from "@/assets/image/Loan.png";
import payminImg from "@/assets/image/Paymin.png";
import canpreImg from "@/assets/image/Canpre.png";

export default function Statinfo() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRecommendation(user.uid);
      } else {
        console.log("No user login");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchRecommendation = async (uid) => {
    try {
      const q = query(
        collection(db, "recommendation", uid, "history"),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setData(docData);
      } else {
        console.log("No recommendation found");
      }
    } catch (err) {
      console.error("Fetch recommendation error:", err);
    }

    setLoading(false);
  };

  const personaImages = {
    CAN_PAY_MINIMUM: payminImg,
    CAN_PREPAY: canpreImg,
    FULL_CLEARANCE: fullClearanceImg,
    LOAN_ROLLOVER: loanImg
  };

  const personaImage = data ? personaImages[data.group] : null;

  return (
    <div className="space-y-8">

      {/* ✅ STATUS + ROBOT (แยกกัน) */}
      <div className="grid md:grid-cols-3 gap-6 items-center">

        {/* 🤖 ROBOT */}
        <div className="flex justify-center order-1 md:order-2">
          {personaImage && (
            <img
              src={personaImage}
              alt={data?.group}
              className="w-[180px] md:w-[220px] object-contain drop-shadow-xl"
            />
          )}
        </div>

        {/* ✅ STATUS CARD */}
        <div className="md:col-span-2 order-2 md:order-1">
          <div className="bg-gradient-to-br from-purple-300 to-white rounded-3xl p-8 md:p-12 shadow-xl">
            
            <h2 className="text-5xl font-semibold">
              Status
            </h2>

            <div className="pb-2 pt-4">
              <p className="text-xl md:text-2xl text-black">
                {loading ? "Loading..." : data?.financial_status || "-"}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ✅ CONTENT */}
      <div className="space-y-8">

        {/* 💰 TOP: Payment + Cash (วางคู่กัน) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Recommended Payment */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <p className="text-2xl text-gray-500 text-center">
              Recommended Payment
            </p>

            <p className="text-5xl font-bold text-center">
              {data?.recommended_payment
                ? Number(data.recommended_payment).toLocaleString() + " ฿"
                : "-"}
            </p>
          </div>

          {/* Remaining Cash */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <p className="text-2xl text-gray-500 text-center">
              Remaining Monthly Cash
            </p>

            <p className="text-5xl font-bold text-center">
              {data?.remaining_monthly_cash
                ? Number(data.remaining_monthly_cash).toLocaleString() + " ฿"
                : "-"}
            </p>
          </div>

        </div>

        {/* 📋 BOTTOM: Actions + Benefits */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Actions */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-semibold text-4xl mb-2">
              Actions
            </h3>

            <ul className="list-disc list-inside space-y-1 text-xl">
              {data?.actions?.length
                ? data.actions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                : <li>-</li>}
            </ul>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-semibold text-4xl mb-3">
              Benefits
            </h3>

            <ul className="list-disc list-inside space-y-1 text-xl">
              {data?.benefits?.length
                ? data.benefits.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                : <li>-</li>}
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}