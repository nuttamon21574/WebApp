import { useState } from "react";
import { auth, db } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";

import SaveButton from "../Button/SaveButton";
import AddManual from "../Button/AddManual";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parse, format, isValid } from "date-fns";

import { useNavigate } from "react-router-dom";

import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";





/* =======================================================
   MAIN COMPONENT
======================================================= */
export default function ManualEntry({ provider, txId  }) {
  const navigate = useNavigate();


  const emptyItem = {
    productName: "",
    purchaseDate: "",
    dueDate: "",
    totalDebt: "",
    annualInterestRate: "",
    totalInstallments: "",
    monthlyInstallment: "",
    outstandingDebt: "",
  };

  const [items, setItems] = useState([emptyItem]);

  useEffect(() => {
    const fetchTx = async () => {
      if (!txId) return;

      const user = auth.currentUser;
      if (!user) return;

      try {
        const ref = doc(db, "bnplDebt", user.uid, "items", txId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const d = snap.data();

          setItems([
            {
              productName: d.productName || "",
              purchaseDate: d.purchaseDate || "",
              dueDate: d.dueDate || "",
              totalDebt: d.totalDebt || "",
              annualInterestRate: d.annualInterestRate || 0,
              totalInstallments: d.totalInstallments || "",
              monthlyInstallment: d.monthlyInstallment || "",
              outstandingDebt: d.outstandingDebt || "",
            }
          ]);
        }
      } catch (err) {
        console.error("โหลดข้อมูลไม่สำเร็จ:", err);
      }
    };

    fetchTx();
  }, [txId]);

  const isItemComplete = (item) =>
    item.productName.trim() !== "" &&
    item.purchaseDate &&
    item.dueDate &&
    item.totalDebt !== "" &&
    item.annualInterestRate !== "" &&
    item.totalInstallments !== "" &&
    item.monthlyInstallment !== "" &&
    item.outstandingDebt !== "" &&
    parseInt(item.totalInstallments) > 0;

  const lastItemComplete = isItemComplete(items[items.length - 1]);
  const isComplete = items.every(isItemComplete);

  /* -------------------- Handlers -------------------- */
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    setItems((prev) => {
      const updated = [...prev];
      updated[index][name] = value;
      return updated;
    });
  };

  const addItem = () => {
    if (!lastItemComplete) {
      alert("Please complete the current product before adding a new one.");
      return;
    }
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length ? updated : [emptyItem]);
  };

  /* -------------------- Save to Firestore -------------------- */

const handleSave = async () => {
  console.log("🔥 START SAVE");

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    return;
  }

  const uid = user.uid;

  if (!isComplete) {
    alert("Please complete all fields");
    return;
  }

  try {
    const providerKey =
      provider?.toLowerCase().includes("laz")
        ? "LazPayLater"
        : "SPayLater";

    const batchId = Date.now();

    for (const item of items) {
      const uniqueKey = `${providerKey}_${item.productName}`;

      const q = query(
        collection(db, "bnplDebt", uid, "items"),
        where("uniqueKey", "==", uniqueKey)
      );

      const existing = await getDocs(q);

      let docRef; // ✅ FIX: ใช้ร่วมกันทั้ง create/update

      if (!existing.empty) {
        // ======================
        // 🔄 UPDATE
        // ======================
        console.log("♻️ UPDATING:", uniqueKey);

        docRef = existing.docs[0].ref;

        await updateDoc(docRef, {
          productName: item.productName || "-",
          purchaseDate: item.purchaseDate || "",
          dueDate: item.dueDate || "",
          totalDebt: Number(item.totalDebt) || 0,
          outstandingDebt: Number(item.outstandingDebt) || 0,
          monthlyInstallment: Number(item.monthlyInstallment) || 0,
          totalInstallments: Number(item.totalInstallments) || 0,
          annualInterestRate: Number(item.annualInterestRate) || 0,
          provider: providerKey,
          source: "manual",
          batchId: String(batchId),
          updatedAt: serverTimestamp(),
        });
      } else {
        // ======================
        // 🆕 CREATE
        // ======================
        console.log("💾 NEW RECORD:", uniqueKey);

        docRef = await addDoc(
          collection(db, "bnplDebt", uid, "items"),
          {
            productName: item.productName || "-",
            purchaseDate: item.purchaseDate || "",
            dueDate: item.dueDate || "",
            totalDebt: Number(item.totalDebt) || 0,
            outstandingDebt: Number(item.outstandingDebt) || 0,
            monthlyInstallment: Number(item.monthlyInstallment) || 0,
            totalInstallments: Number(item.totalInstallments) || 0,
            annualInterestRate: Number(item.annualInterestRate) || 0,
            provider: providerKey,
            source: "manual",
            batchId: String(batchId),
            createdAt: serverTimestamp(),
            uniqueKey,
          }
        );
      }

    }

    await fetch("https://your-backend.onrender.com/api/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid }),
    });

    setItems([emptyItem]);
    navigate("/dashboard");

  } catch (err) {
    console.error("🔥 ERROR:", err);
    alert(err.message);
  }
};

  /* -------------------- UI -------------------- */
  return (
    <div className="space-y-10">
      {items.map((item, index) => (
        <div key={index} className="border rounded-2xl p-8 bg-gray-50">
          <div className="flex justify-between mb-6">
            <h3 className="font-semibold text-lg">Product {index + 1}</h3>
            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm items-stretch">
            <TextField
              label="Product Name"
              name="productName"
              value={item.productName}
              onChange={(e) => handleChange(index, e)}
            />

            <DateField
              label="Purchase Date"
              name="purchaseDate"
              value={item.purchaseDate}
              onChange={(e) => handleChange(index, e)}
            />

            <DateField
              label="Latest Payment Due Date"
              name="dueDate"
              value={item.dueDate}
              onChange={(e) => handleChange(index, e)}
            />

            <NumberField
              label="Total Debt"
              name="totalDebt"
              value={item.totalDebt}
              onChange={(e) => handleChange(index, e)}
              step="0.01"
              unit="Baht"
            />

            <NumberField
              label="Annual Interest Rate"
              name="annualInterestRate"
              value={item.annualInterestRate}
              onChange={(e) => handleChange(index, e)}
              step="0.01"
              unit="%"
            />

            <SelectField
              label="Total Installments"
              name="totalInstallments"
              value={item.totalInstallments}
              onChange={(e) => handleChange(index, e)}
              options={[
                "1","2", "3", "5", "6", "9", "12", "18", "24", "36"
              ]}
            />

            <NumberField
              label="Monthly Installment"
              name="monthlyInstallment"
              value={item.monthlyInstallment}
              onChange={(e) => handleChange(index, e)}
              step="0.01"
              unit="Baht"
            />

            <NumberField
              label="Outstanding Debt"
              name="outstandingDebt"
              value={item.outstandingDebt}
              onChange={(e) => handleChange(index, e)}
              step="0.01"
              unit="Baht"
            />
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <AddManual
          onClick={addItem}
          text="Add Product"
          disabled={!lastItemComplete}
        />
      </div>

      <div className="flex justify-center gap-8">
        <SaveButton isComplete={isComplete} onClick={handleSave} />
      </div>
    </div>
  );
}

/* =======================================================
   FIELD COMPONENTS
======================================================= */
function TextField({ label, name, value, onChange }) {
  return (
    <div className="flex flex-col h-full">
      <h4 className="mb-2 font-medium text-gray-700">{label}</h4>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full h-14 border rounded-xl px-4 py-3 text-left"
      />
    </div>
  );
}

function NumberField({ label, name, value, onChange, step = "1", min = "0", unit = "" }) {
  return (
    <div className="flex flex-col h-full">
      <h4 className="mb-2 font-medium text-gray-700">{label}</h4>
      <div className="relative h-14">
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          step={step}
          min={min}
          className="w-full h-full border rounded-xl px-4 py-3 pr-20 text-left"
        />
        {unit && <span className="absolute right-4 top-3 text-gray-500 text-sm">{unit}</span>}
      </div>
    </div>
  );
}

function DateField({ label, name, value, onChange }) {
  let selectedDate = null;
  if (value) {
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    selectedDate = isValid(parsed) ? parsed : null;
  }

  const handleChangeDate = (date) => {
    onChange({ target: { name, value: date ? format(date, "dd/MM/yyyy") : "" } });
  };

  return (
    <div>
      <h4 className="mb-2 font-medium text-gray-700">{label}</h4>
      <DatePicker
        selected={selectedDate}
        onChange={handleChangeDate}
        dateFormat="dd/MM/yyyy"
        placeholderText="dd/mm/yyyy"
        className="w-full h-14 border rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-400"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        yearDropdownItemNumber={50}
        scrollableYearDropdown
        isClearable
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="flex flex-col h-full">
      <h4 className="mb-2 font-medium text-gray-700">{label}</h4>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full h-14 border rounded-xl px-4 py-3 text-left"
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt} {label.includes("Installments") ? "months" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}