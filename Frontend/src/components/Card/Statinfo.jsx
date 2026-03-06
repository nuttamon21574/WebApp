import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where
} from "firebase/firestore";
import { db, auth } from "@/firebase";

export default function Statinfo() {

  const [data, setData] = useState(null);

  useEffect(() => {
    fetchRecommendation();
  }, []);

  const fetchRecommendation = async () => {

    try {

      const user = auth.currentUser;

      if (!user) {
        console.log("No user login");
        return;
      }

      const q = query(
        collection(db, "recommendation"),
        where("userId", "==", user.uid),
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

  };

  return (
    <div className="space-y-8">

      {/* Status */}
      <div className="bg-gradient-to-br from-purple-300 to-white rounded-3xl p-14 shadow-xl">
        <h2 className="text-xl font-semibold">
          Status
        </h2>

        <div className="pb-10 pt-5">
          <p className="text-black/80">
            {data?.financial_status || "-"}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* AI Animation */}
        <div className="rounded-l flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/44c310e7-4de4-45dc-a3dc-7df7ab9e7210/eMFuITyaLp.lottie"
            loop
            autoplay
            style={{ width: "480px", height: "450px" }}
          />
        </div>

        <div className="md:col-span-2 space-y-6">

          <div className="grid grid-cols-2 gap-6">

            {/* Recommended Payment */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <p className="text-sm text-gray-500">
                Recommended Payment
              </p>

              <p className="text-2xl font-bold">
                {data?.recommended_payment
                  ? Number(data.recommended_payment).toLocaleString() + " ฿"
                  : "-"}
              </p>
            </div>

            {/* Remaining Cash */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <p className="text-sm text-gray-500">
                Remaining Monthly Cash
              </p>

              <p className="text-2xl font-bold">
                {data?.remaining_monthly_cash
                  ? Number(data.remaining_monthly_cash).toLocaleString() + " ฿"
                  : "-"}
              </p>
            </div>

          </div>

          {/* Actions */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-semibold text-lg mb-2">
              Action
            </h3>

            <ul className="list-disc list-inside space-y-1 text-sm">
              {data?.advice?.length
                ? data.advice.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                : <li>-</li>}
            </ul>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-semibold text-lg mb-3">
              Benefits
            </h3>

            <ul className="list-disc list-inside space-y-1 text-sm">
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