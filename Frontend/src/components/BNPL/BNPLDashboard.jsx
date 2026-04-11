import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  getDoc,
  doc,
  deleteDoc
} from "firebase/firestore";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from "recharts";



export default function BNPLDashboard() {
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dtiHistory, setDtiHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const toNumber = (val) =>
    typeof val === "number" ? val : parseFloat(val) || 0;

  useEffect(() => {
    let unsubTx = null;
    let unsubDTI = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      // =============================
      // USER DATA
      // =============================
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data() || {};
      const summary = userData || {}; // 🔥 ใช้ตรง ๆ ไม่ใช้ summary ซ้อน

      const spayLimit = userData.spaylater_limit || 0;
      const lazLimit = userData.lazpaylater_limit || 0;

      // =============================
      // TRANSACTIONS
      // =============================
      const qTx = query(
        collection(db, "bnplDebt", user.uid, "items"),
        orderBy("createdAt", "desc")
      );

      unsubTx = onSnapshot(qTx, (snap) => {
        const txMap = new Map();

        snap.forEach((docSnap) => {
          const d = docSnap.data();

          const tx = {
            id: docSnap.id,
            productName: d.productName || "-",
            purchaseDate: d.purchaseDate || "",
            amount: toNumber(d.outstandingDebt),
            platform: (d.provider || "").toLowerCase(),
            createdAt: d.createdAt?.toDate?.() || new Date(0)
          };

          // 🔥 key = สินค้า + วันที่ซื้อ
          const key = `${tx.productName}_${tx.purchaseDate}`;

          if (!txMap.has(key)) {
            txMap.set(key, tx);
          } else {
            const existing = txMap.get(key);

            if (tx.createdAt > existing.createdAt) {
              txMap.set(key, tx);
            }
          }
        });

        // 🔥 final list (dedupe + sort)
        const finalTx = Array.from(txMap.values())
          .sort((a, b) => b.createdAt - a.createdAt);

        setTransactions(finalTx);

        // =============================
        // ✅ FIX: ใช้ finalTx แทน allTx
        // =============================
        let spayDebt = 0;
        let lazDebt = 0;

        finalTx.forEach((tx) => {
          if (tx.platform.includes("spay")) {
            spayDebt += tx.amount;
          } else if (tx.platform.includes("laz")) {
            lazDebt += tx.amount;
          }
        });

        const totalDebt = spayDebt + lazDebt;

        setData({
          outstanding: totalDebt,
          utilization:
            totalDebt > 0
              ? ((totalDebt / (spayLimit + lazLimit)) * 100)
              : 0,
          available:
            spayLimit + lazLimit - totalDebt,

          spayLimit,
          lazLimit,
          spayDebt,
          lazDebt
        });

        setLoading(false);
      });

      // =============================
      // DTI HISTORY
      // =============================
      const qDTI = query(
        collection(db, "DTI", user.uid, "history")
      );

      unsubDTI = onSnapshot(qDTI, (snap) => {
        const history = [];

        snap.forEach((docSnap) => {
          const d = docSnap.data();

          history.push({
            date: d.createdAt?.toDate?.() || new Date(),
            dti: (d.installment_to_income || 0) * 100,
          });
        });

        history.sort((a, b) => a.date - b.date);
        setDtiHistory(history);
      });
    });

    return () => {
      unsubAuth();
      if (unsubTx) unsubTx();
      if (unsubDTI) unsubDTI();
    };
  }, []);

  if (loading || !data)
    return <div className="p-8 text-lg">Loading...</div>;

  // =============================
  // BAR DATA
  // =============================
  const platformCompareData = [
    {
      name: "SPayLater",
      outstanding: data.spayDebt,
      available: data.spayLimit
    },
    {
      name: "LazPayLater",
      outstanding: data.lazDebt,
      available: data.lazLimit
    }
  ];

  const handleDeleteTransaction = async (txId) => {
    const user = auth.currentUser;
    if (!user) return;

    const confirmDelete = window.confirm(
      "ยืนยันลบรายการหนี้นี้หรือไม่? ยอดหนี้และการคำนวณจะอัปเดตใหม่หลังลบ"
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "bnplDebt", user.uid, "items", txId));

      await fetch("http://localhost:5000/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: user.uid }),
      });
    } catch (err) {
      console.error("Delete transaction failed:", err);
      alert("ไม่สามารถลบรายการได้ กรุณาลองใหม่");
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "all") return true;
    if (activeTab === "spay") return tx.platform.includes("spay");
    if (activeTab === "laz") return tx.platform.includes("laz");
    return true;
  });

  return (
    <div className="p-0 bg-gray-50 min-h-screen text-lg">

      {/* KPI */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow">
          <p>Total Debt</p>
          <p className="text-3xl font-bold">
            {data.outstanding.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow">
          <p>Credit Utilization</p>
          <p className="text-3xl font-bold">
            {data.utilization.toFixed(0)}%
          </p>
        </div>

        
      </div>

      {/* 🔥 2 CHARTS */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">

        {/* BAR */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">
            BNPL Snapshot
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformCompareData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="outstanding" fill="#6B21A8" />
              <Bar dataKey="available" fill="#C084FC" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DTI */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">
            DTI Trend
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dtiHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) =>
                  new Date(date).toLocaleDateString()
                }
              />
              <YAxis />
              <Tooltip
                formatter={(value) => `${value.toFixed(0)}%`}
              />
              <Line
                type="monotone"
                dataKey="dti"
                stroke="#8884d8"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* 🔥 TRANSACTIONS */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4">
          Recent Transactions
        </h2>

        {/* 🔥 TABS */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "all", label: "All" },
            { key: "spay", label: "SPayLater" },
            { key: "laz", label: "LazPayLater" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
             className={`px-4 py-2 rounded-full text-sm font-semibold transition`}
              style={{
                backgroundColor: activeTab === tab.key ? "#6B21A8" : "#EDE9FE",
                color: activeTab === tab.key ? "#fff" : "#6B21A8"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {/* 🔥 LIST */}
          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500">No transactions</p>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between border-b py-2 items-center gap-3"
              >
                <div>
                  <p className="font-semibold">
                    {tx.productName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {tx.platform}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-bold">
                    {tx.amount.toLocaleString()} Baht
                  </p>
                  <button
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}