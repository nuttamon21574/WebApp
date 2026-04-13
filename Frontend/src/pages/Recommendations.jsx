import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import MonthPicker from "../components/Button/MonthPicker.jsx";
import Statinfo from "../components/Card/Statinfo.jsx";

import { db, auth } from "../firebase";
/*import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";*/

import { doc, getDoc } from "firebase/firestore";

export default function Recommendations() {

  const [advice, setAdvice] = useState(null);

  useEffect(() => {

    const fetchRecommendation = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, "recommendation", user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setAdvice(snap.data().latest); // 🔥 ดึง latest
        }

      } catch (err) {
        console.error("Fetch recommendation error:", err);
      }
    };

    fetchRecommendation();

  }, []);

  return (

<div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-10 py-6">

  <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 h-full">

    <Sidebar activeTab="Recommendations" />

    <div className="flex flex-col mt-6 lg:mt-0">

      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-50">
        Recommendation
      </p>

      <div className="mt-4 mb-6">
        <MonthPicker />
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 w-full shadow-md">

        <div className="flex flex-col gap-6">

          <Statinfo />

          {advice && (
            <div className="space-y-6">

              <div>
                <p className="font-bold text-lg sm:text-xl">Financial Status</p>
                <p className="text-gray-700 text-sm sm:text-base">
                  {advice.financial_status}
                </p>
              </div>

              <div>
                <p className="font-bold text-lg sm:text-xl">Strategy</p>
                <p className="text-gray-700 text-sm sm:text-base">
                  {advice.strategy}
                </p>
              </div>

              <div>
                <p className="font-bold text-lg sm:text-xl">
                  Recommended Payment
                </p>
                <p className="text-gray-700 text-base sm:text-lg font-semibold">
                  {advice.recommended_payment} บาท
                </p>
              </div>

              <div>
                <p className="font-bold text-lg sm:text-xl">Actions</p>
                <ul className="list-disc pl-6 text-sm sm:text-base space-y-1">
                  {(advice.actions || []).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-bold text-lg sm:text-xl">Benefits</p>
                <ul className="list-disc pl-6 text-sm sm:text-base space-y-1">
                  {(advice.benefits || []).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>

  </div>

</div>

  );
}