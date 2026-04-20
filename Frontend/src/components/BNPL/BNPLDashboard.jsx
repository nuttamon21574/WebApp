import { useEffect, useState, useRef } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  getDoc,
  doc,
  deleteDoc,
  updateDoc 
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

import { useNavigate } from "react-router-dom";

export default function BNPLDashboard() {
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dtiHistory, setDtiHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [userData, setUserData] = useState(null)
  const debounceRef = useRef(null)
  const lastPayloadRef = useRef(null)
  const isFirstLoad = useRef(true)
  const navigate = useNavigate();

  const toNumber = (val) =>
    typeof val === "number" ? val : parseFloat(val) || 0;

  useEffect(() => {
  let unsubAuth = null;
  let unsubUser = null;
  let unsubTx = null;
  let unsubDTI = null;

  unsubAuth = onAuthStateChanged(auth, (user) => {
    if (!user) return;

    // =============================
    // USER (REALTIME)
    // =============================
    unsubUser = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        }
      }
    );

    // =============================
    // TRANSACTIONS (REALTIME)
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

      amount: toNumber(
        d.outstandingDebt ??
        d.totalDebt ??
        d.amount ??
        0
      ),

      monthlyInstallment: toNumber(d.monthlyInstallment || 0),
      paidAmount: toNumber(d.paidAmount || 0),
      status: d.status || "active",

      provider: d.provider || "", // ✅ เพิ่ม
      totalInstallments: Number(d.totalInstallments || 0), // ✅ เพิ่ม

      platform: (d.provider || "").toLowerCase(),
      createdAt: d.createdAt?.toDate?.() || new Date(0)
    };
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

      const finalTx = Array.from(txMap.values())
        .sort((a, b) => b.createdAt - a.createdAt);

      setTransactions(finalTx);
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
    if (unsubAuth) unsubAuth();
    if (unsubUser) unsubUser();
    if (unsubTx) unsubTx();
    if (unsubDTI) unsubDTI();
  };
}, []);

  useEffect(() => {
  if (!userData) return;

  let spayDebt = 0;
  let lazDebt = 0;

  transactions.forEach((tx) => {
    if (tx.platform.includes("spay")) {
      spayDebt += tx.amount;
    } else if (tx.platform.includes("laz")) {
      lazDebt += tx.amount;
    }
  });

  const totalDebt = spayDebt + lazDebt;

  const spayLimit = userData.spaylater_limit || 0;
  const lazLimit = userData.lazpaylater_limit || 0;
  const totalLimit = spayLimit + lazLimit;

  console.log("🔥 RECOMPUTE:", {
    transactions,
    totalDebt
  });

  setData({
    outstanding: totalDebt,
    utilization:
      totalLimit > 0
        ? (totalDebt / totalLimit) * 100
        : 0,
    available: totalLimit - totalDebt,

    spayLimit,
    lazLimit,
    spayDebt,
    lazDebt
  });

  setLoading(false);

}, [userData, JSON.stringify(transactions)]);

if (loading)
  return <div className="p-8 text-lg">Loading...</div>;

    const currentDTI = userData?.income
    ? (data.outstanding / userData.income) * 100
    : 0;

    const mergedDTI = [
    ...dtiHistory,
    {
      date: new Date(),
      dti: currentDTI,
      isCurrent: true,
    },
  ];

  const renderDot = (props) => {
  const { cx, cy, payload } = props;

  if (payload.isCurrent) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#EF4444"
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="#8884d8"
    />
  );
};
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

          const getCurrentMonth = () => {
      const now = new Date();
      const thai = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
      );

      return `${thai.getFullYear()}-${String(
        thai.getMonth() + 1
      ).padStart(2, "0")}`;
    };


    try {
      await deleteDoc(doc(db, "bnplDebt", user.uid, "items", txId));

      setTransactions((prev) => prev.filter(tx => tx.id !== txId));
      const API_URL = "https://webapp-osky.onrender.com";

      fetch(`${API_URL}/api/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: user.uid,
        month: getCurrentMonth(), // ✅ เพิ่มตรงนี้
      }),
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
            <LineChart data={mergedDTI}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) =>
                  new Date(date).toLocaleDateString()
                }
              />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "DTI"]}
              />
              <Line
                type="monotone"
                dataKey="dti"
                stroke="#8884d8"
                strokeWidth={3}
                dot={renderDot}
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
        <div className="flex gap-2 mb-4 overflow-x-auto whitespace-nowrap">
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
  {filteredTransactions.length === 0 ? (
    <p className="text-gray-500">No transactions</p>
  ) : (
    filteredTransactions.map((tx) => {
      const status =
        tx.status || (tx.amount === 0 ? "paid" : "active");

      return (
        <div
          key={tx.id}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b py-3 items-center"
        >
          {/* LEFT */}
          <div className="md:col-span-2">
            <p className="font-semibold truncate">
              {tx.productName}
            </p>

            <p className="text-sm text-gray-500 truncate">
              {tx.platform}
            </p>

            <p
              className={`text-xs mt-1 ${
                status === "paid"
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {status}
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex md:flex-col md:items-end justify-between md:justify-center gap-2">
            
            <p className="font-bold whitespace-nowrap">
              {tx.amount.toLocaleString()} Baht
            </p>

            {/* ACTION */}
            <div className="flex justify-end">
              {tx.amount === 0 ? (
                <button
                  onClick={() => handleDeleteTransaction(tx.id)}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Delete
                </button>
              ) : (
                <select
                  onChange={async (e) => {
                    const action = e.target.value;
                    if (!action) return;

                    const user = auth.currentUser;
                    if (!user) return;

                    let amount = 0;

                    if (action === "min") {
                      amount = tx.monthlyInstallment || 0;
                    }

                    if (action === "extra") {
                      amount = Number(prompt("Enter amount"));
                      if (!amount || amount <= 0) return;
                    }

                    if (action === "full") {
                      amount = tx.amount;
                    }

                    /*if (action === "postpone") {
                      await updateDoc(
                        doc(db, "bnplDebt", user.uid, "items", tx.id),
                        { status: "postponed" }
                      );

                      await fetch("https://your-backend.onrender.com/api/calculate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ uid: user.uid }),
                      });

                      e.target.value = "";
                      return;
                    }*/
                   if (action === "postpone") {
                    await updateDoc(
                      doc(db, "bnplDebt", user.uid, "items", tx.id),
                      { status: "postponed" }
                    );

                    console.log("TX:", tx);

                    navigate("/bnpl", {
                      state: {
                        startMode: "manual",
                        provider: tx.provider || "SPayLater", // ✅ FIX
                        txId: tx.id
                      }
                    });

                    return;
                  }

                    const newOutstanding = Math.max(0, tx.amount - amount);

                    await updateDoc(
                      doc(db, "bnplDebt", user.uid, "items", tx.id),
                      {
                        outstandingDebt: newOutstanding,
                        paidAmount: (tx.paidAmount || 0) + amount,
                        status: newOutstanding === 0 ? "paid" : "active",
                      }
                    );

                    const API_URL = "https://webapp-osky.onrender.com";
                    
                    fetch(`${API_URL}/api/calculate`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ uid: user.uid }),
                    });

                    e.target.value = "";
                  }}
                  className="text-xs border rounded px-2 py-1"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Pay
                  </option>
                  <option value="min">Pay Minimum</option>
                  <option value="extra">Pay Extra</option>
                  <option value="full">Full Payment</option>
                  {tx.totalInstallments === 1 && (
                    <option value="postpone">Postpone</option>
                  )}
                </select>
              )}
            </div>
          </div>
        </div>
      );
    })
  )}
</div>
      </div>
    </div>
  );
}