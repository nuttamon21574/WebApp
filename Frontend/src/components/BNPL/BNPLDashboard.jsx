import { useEffect, useState } from "react";

import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, Legend, LabelList
} from "recharts";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import shopeeLogo from "@/assets/image/shopee.png";
import lazadaLogo from "@/assets/image/lazada.png";

export default function BNPLDashboard() {

  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [platformFilter, setPlatformFilter] = useState("All");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const providersSnap = await getDocs(
        collection(db, "bnplDebt", user.uid, "providers")
      );

      let providers = [];
      let totalOutstanding = 0;
      let allTx = [];

      for (const docSnap of providersSnap.docs) {
        const d = docSnap.data();
        const providerName = d.bnplProvider || docSnap.id;
        const amount = d.provider_outstanding || 0;

        providers.push({
          name: providerName,
          outstanding: amount
        });

        totalOutstanding += amount;

        const entriesSnap = await getDocs(
          collection(db, "bnplDebt", user.uid, "providers", docSnap.id, "entries")
        );

        entriesSnap.forEach((entryDoc) => {
          const e = entryDoc.data();

          const created = e.createdAt?.toDate?.() || new Date();

          const totalTerms = e.selected_terms || 1;
          const remaining = e.remaining_installments ?? totalTerms;

          const safeRemaining = Math.max(0, Math.min(remaining, totalTerms));

          const currentInstallment =
            safeRemaining === 0
              ? totalTerms
              : totalTerms - safeRemaining + 1;

          const dueDate = new Date(
            created.getTime() +
              (currentInstallment - 1) * 30 * 24 * 60 * 60 * 1000
          );

          const today = new Date();
          let status = "Pending";

          if (safeRemaining === 0) status = "Paid";
          else if (today > dueDate) status = "Overdue";

          allTx.push({
            id: entryDoc.id,
            date: created,
            platform: providerName,
            dueDate,
            amount: e.outstanding_debt || 0,
            installment: `${currentInstallment}/${totalTerms}`,
            status
          });
        });
      }

      const totalLimit =
        (userData?.spaylater_limit || 0) +
        (userData?.lazpaylater_limit || 0);

      setData({
        providers,
        outstanding: totalOutstanding,
        limit: totalLimit,
        available: totalLimit - totalOutstanding,
        utilization: userData?.credit_utilization || 0,
        dti: userData?.installment_to_income || 0
      });

      allTx.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setTransactions(allTx);
      setLoading(false);
    });

    

    return () => unsub();
  }, []);

  if (loading || !data) return <div className="p-8 text-lg">Loading...</div>;

  const providerCount = data.providers.length || 1;

  const barData = data.providers.map((p) => ({
    name: p.name,
    outstanding: p.outstanding,
    limit: data.limit / providerCount
  }));

  const getLogo = (name) => {
    if (name.toLowerCase().includes("spay")) return shopeeLogo;
    if (name.toLowerCase().includes("laz")) return lazadaLogo;
    return null;
  };

  const filteredTx =
    platformFilter === "All"
      ? transactions
      : transactions.filter((tx) =>
          tx.platform.toLowerCase().includes(platformFilter.toLowerCase())
        );

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-lg">

      {/* KPI */}
      <div className="mt-0 grid md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow">
          <p className="text-gray-500 text-base">Total Debt</p>
          <p className="text-3xl font-bold text-purple-700">
            {data.outstanding.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow">
          <p className="text-gray-500 text-base">Credit Utilization</p>
          <p className="text-3xl font-bold text-purple-700">
            {(data.utilization * 100).toFixed(0)}%
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow">
          <p className="text-gray-500 text-base">DTI</p>
          <p className="text-3xl font-bold text-green-600">
            {(data.dti * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">

        {/* LEFT = BAR */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold text-lg mb-3">
            Outstanding vs Limit
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={barData}
              margin={{ top: 30, right: 20, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip />
              <Legend />

              <Bar dataKey="outstanding" fill="#6D28D9">
                <LabelList dataKey="outstanding" position="top" />
              </Bar>

              <Bar dataKey="limit" fill="#C4B5FD">
                <LabelList dataKey="limit" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 border-t pt-4 text-base">
            <div className="flex justify-between">
              <span>Total Used</span>
              <span className="font-semibold text-purple-700 text-lg">
                {data.outstanding.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Available</span>
              <span className="font-semibold text-green-600 text-lg">
                {data.available.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">

          {/* TABLE */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-semibold text-lg mb-4">
              Recent Transactions
            </h3>

            <div className="flex gap-3 mb-4">
              {["All", "SPayLater", "LazPayLater"].map((p) => {
                const isActive = platformFilter === p;

                return (
                  <button
                    onClick={() => setPlatformFilter(p)}
                    style={{
                      backgroundColor: platformFilter === p ? "#3c2064" : "#ffffff",
                      color: platformFilter === p ? "#ffffff" : "#000000"
                    }}
                    className="px-4 py-2 rounded-xl font-semibold"
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <div className="max-h-[240px] overflow-y-auto">
              <table className="w-full text-base">
                <thead className="border-b text-gray-500 text-sm sticky top-0 bg-white">
                  <tr>
                    <th className="text-left py-3">Date</th>
                    <th className="text-left">Platform</th>
                    <th className="text-left">Due</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Installment</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTx.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        {tx.date.toLocaleDateString("en-GB")}
                      </td>
                      <td>{tx.platform}</td>
                      <td>
                        {tx.dueDate.toLocaleDateString("en-GB")}
                      </td>
                      <td className="text-right text-lg font-semibold">
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="text-right text-lg font-bold text-purple-700">
                        {tx.installment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PLATFORM */}
          <div className="bg-white p-6 rounded-2xl shadow flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base">Platforms</p>
              <p className="text-3xl font-bold">
                {data.providers.length}
              </p>
            </div>

            <div className="flex gap-3">
              {data.providers.length === 1 ? (
                <img
                  src={getLogo(data.providers[0].name)}
                  className="w-12 h-12"
                />
              ) : (
                data.providers.map((p, i) => (
                  <img key={i} src={getLogo(p.name)} className="w-12 h-12" />
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}