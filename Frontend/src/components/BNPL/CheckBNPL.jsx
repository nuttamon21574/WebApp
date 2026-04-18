import SaveButton from "../Button/SaveButton";
import { auth, db } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";

import { parse, format, isValid } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";


export default function CheckBNPL({ contracts = [], onSave }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const emptyItem = {};

  const normalizeDate = (dateStr) => {
  if (!dateStr) return "";

  const d1 = parse(dateStr, "dd/MM/yyyy", new Date());
  const d2 = parse(dateStr, "MM/dd/yyyy", new Date());

  const valid = isValid(d1) ? d1 : isValid(d2) ? d2 : null;

  if (!valid) return "";

  return format(valid, "dd/MM/yyyy");

};

  const formatValue = (val, isBaht) => {
    if (isBaht && typeof val === "number") {
      return val.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    return val ?? "-";
  };

  const Field = ({ label, value, isBaht }) => (
    <>
      <label className="md:col-span-4 font-medium text-gray-800 flex items-center min-h-[40px]">
        {label}
      </label>

      <div className="md:col-span-8 bg-gray-100 rounded-lg px-4 py-2
                     text-gray-800 flex justify-between items-center min-h-[40px]">
        <span className="truncate font-mono">
          {formatValue(value, isBaht)}
        </span>
        {isBaht && (
          <span className="ml-2 text-gray-500 text-xs uppercase">
            Baht
          </span>
        )}
      </div>
    </>
  );

  /* ================= SAVE FUNCTION ================= */
  const handleSave = async () => {
    console.log("🔥 START SAVE");

    const user = auth.currentUser;

    if (!user) {
      alert("User not logged in");
      return;
    }

    const uid = user.uid;
    const batchId = Date.now();
    const savedIds = [];


    try {
      for (const contract of contracts) {

        const provider = contract.provider || "SPayLater";

        const uniqueKey = `${contract.provider || "SPayLater"}_${contract.productName}_${normalizeDate(contract.purchaseDate)}`;

        // ✅ เช็ค duplicate ก่อน
        const q = query(
          collection(db, "bnplDebt", uid, "items"),
          where("uniqueKey", "==", uniqueKey)
        );

        const existing = await getDocs(q);

        if (!existing.empty) {
          console.log("♻️ UPDATING:", uniqueKey);

          const docRef = existing.docs[0].ref;

          await updateDoc(docRef, {
            productName: contract.productName || "-",

            purchaseDate: normalizeDate(contract.purchaseDate),
            dueDate: normalizeDate(contract.dueDate),

            totalDebt: Number(contract.totalDebt) || 0,
            outstandingDebt: Number(contract.outstandingDebt) || 0,

            monthlyInstallment: Number(contract.monthlyInstallment) || 0,
            totalInstallments: Number(contract.totalInstallments) || 0,

            annualInterestRate: Number(contract.annualInterestRate) || 0,

            // ✅ fix provider ให้ถูก
            provider: contract.provider || "SPayLater",
            source: "pdf",

            batchId: String(batchId),
            updatedAt: serverTimestamp()
          });
          
          savedIds.push(docRef.id);
          continue;
        }

        console.log("💾 SAVING:", contract);

        const docRef = await addDoc(
          collection(db, "bnplDebt", uid, "items"),
          {
            productName: contract.productName || "-",

            purchaseDate: normalizeDate(contract.purchaseDate),
            dueDate: normalizeDate(contract.dueDate),

            totalDebt: Number(contract.totalDebt) || 0,
            outstandingDebt: Number(contract.outstandingDebt) || 0,

            monthlyInstallment: Number(contract.monthlyInstallment) || 0,
            totalInstallments: Number(contract.totalInstallments) || 0,

            annualInterestRate: Number(contract.annualInterestRate) || 0,

            // ✅ fix provider ให้ถูก
            provider: contract.provider || "SPayLater",
            source: "pdf",

            createdAt: serverTimestamp(),

            uniqueKey
          }
        );

        savedIds.push(docRef.id);

        console.log("✅ SAVED:", docRef.id);
      }

      alert("Saved successfully!");

      // ======================
      // 🔥 CALL BACKEND ONCE
      // ======================
      const API_URL = import.meta.env.VITE_API_URL;

      await fetch(`${API_URL}/api/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid }),
      });

      navigate("/dashboard");

    } catch (err) {
      console.error("🔥 ERROR:", err.code, err.message);
      alert(err.message);
    }
  };

  return (
    <div className="w-full space-y-8">

      {contracts.map((contract, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 md:px-10"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="w-2 h-8 bg-purple-600 rounded-full"></div>
            <h2 className="text-lg font-semibold text-purple-700">
              {contract.productName || `Contract #${index + 1}`}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-4 gap-x-8 items-center text-sm">
            <Field label="Total Debt" value={contract.totalDebt} isBaht />
            <Field label="Outstanding Balance" value={contract.outstandingDebt} isBaht />
            <Field label="Monthly Payment" value={contract.monthlyInstallment} isBaht />
            <Field label="Total Installments" value={contract.totalInstallments} />
            <Field label="Annual Interest Rate" value={`${contract.annualInterestRate || 0}%`} />
            <Field label="Payment Date" value={contract.purchaseDate} />
            <Field label="Due Date" value={contract.dueDate} />
          </div>
        </div>
      ))}

      <div className="flex justify-center pt-4">
        <SaveButton isComplete={true} onClick={handleSave} />
      </div>

    </div>
  );
}