import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import MonthPicker from "../components/Button/MonthPicker.jsx";
import Statinfo from "../components/Card/Statinfo.jsx";

import { db, auth } from "../firebase";
import {
collection,
query,
where,
orderBy,
limit,
getDocs
} from "firebase/firestore";

export default function Recommendations() {

const [advice, setAdvice] = useState(null);

useEffect(() => {

const fetchRecommendation = async () => {

  try {

    const user = auth.currentUser;

    if (!user) return;

    const q = query(
      collection(db, "recommendation"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      setAdvice(snapshot.docs[0].data());
    }

  } catch (err) {
    console.error("Fetch recommendation error:", err);
  }

};

fetchRecommendation();

}, []);

return ( <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-8 py-4 sm:py-6"> <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-full">

    <Sidebar activeTab="Recommendations" />

    <div className="flex flex-col mt-10 lg:mt-0">

      <p className="text-2xl md:text-3xl font-bold text-amber-50">
        Recommendation
      </p>

      <div className="mt-4 mb-8">
        <MonthPicker />
      </div>

      <div className="bg-white rounded-3xl p-10 py-4 w-full">
        <div className="flex flex-col gap-6">

          <Statinfo />

          {advice && (
            <div className="mt-6 space-y-4">

              <div>
                <p className="font-bold text-lg">Financial Status</p>
                <p className="text-gray-700">{advice.financial_status}</p>
              </div>

              <div>
                <p className="font-bold text-lg">Strategy</p>
                <p className="text-gray-700">{advice.strategy}</p>
              </div>

              <div>
                <p className="font-bold text-lg">Recommended Payment</p>
                <p className="text-gray-700">
                  {advice.recommended_payment} บาท
                </p>
              </div>

              <div>
                <p className="font-bold text-lg">Actions</p>
                <ul className="list-disc pl-6">
                  {(advice.actions || []).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-bold text-lg">Benefits</p>
                <ul className="list-disc pl-6">
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
