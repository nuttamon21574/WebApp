import { useState, useEffect } from "react";
import CancelButton from "../Button/CancelButton";
import SaveButton from "../Button/SaveButton";

import { auth, db } from "@/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ManualEntry({ onCancel, onSave }) {

  const emptyForm = {
    totalDebt: "",
    outstandingBalance: "",
    monthlyPayment: "",
    installments: "",
    interest: "",
    startDate: "",
    dueDate: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false); // ✅ กันโหลดซ้ำ

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (loadedOnce) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "manualDebt", user.uid));
        if (snap.exists()) {
          setForm({ ...emptyForm, ...snap.data() });
        }
      } catch (err) {
        console.error("Load error:", err);
      }

      setLoadedOnce(true);
      setLoading(false);
    });

    return () => unsub();
  }, [loadedOnce]);

  /* ================= INPUT ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= VALIDATE ================= */
  const isComplete =
    form.totalDebt &&
    form.outstandingBalance &&
    form.monthlyPayment &&
    form.installments &&
    form.interest &&
    form.dueDate;

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!isComplete) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const payload = {
        ...form,
        totalDebt: Number(form.totalDebt),
        outstandingBalance: Number(form.outstandingBalance),
        monthlyPayment: Number(form.monthlyPayment),
        installments: Number(form.installments),
        interest: Number(form.interest),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "bnplDebt", user.uid), payload, { merge: true });

      // ✅ reset จริง
      setForm(emptyForm);

      // ✅ กัน effect โหลดกลับ
      setLoadedOnce(true);

      onSave?.(payload);

    } catch (err) {
      console.error("Save error:", err);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-10">
      <section>
        <h3 className="font-semibold mb-6 text-lg">
          Debt Details
        </h3>

        <div className="grid grid-cols-2 gap-6 text-sm">

          <Field label="Total Debt (Baht)" name="totalDebt" value={form.totalDebt} onChange={handleChange} full />
          <Field label="Outstanding Balance (Baht)" name="outstandingBalance" value={form.outstandingBalance} onChange={handleChange} full />

          <Field label="Monthly Payment (Baht)" name="monthlyPayment" value={form.monthlyPayment} onChange={handleChange} />
          <Field label="Number of Installments" name="installments" value={form.installments} onChange={handleChange} />

          <Field label="Interest (Baht)" name="interest" value={form.interest} onChange={handleChange} />
          <DateField label="Start Date" name="startDate" value={form.startDate} onChange={handleChange} />
          <DateField label="Payment Due Date" name="dueDate" value={form.dueDate} onChange={handleChange} />

        </div>
      </section>

      <div className="flex justify-center gap-8">
        <CancelButton onCancel={onCancel} />
        <SaveButton isComplete={isComplete} onClick={handleSave} />
      </div>
    </div>
  );
}

/* ================= INPUT COMPONENT ================= */

function Field({ label, name, value, onChange, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <h4 className="font-medium text-gray-700 mb-2">{label}</h4>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white
                   focus:outline-none focus:ring-2 focus:ring-purple-300"
      />
    </div>
  );
}

function DateField({ label, name, value, onChange }) {
  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-2">{label}</h4>
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white
                   focus:outline-none focus:ring-2 focus:ring-purple-300"
      />
    </div>
  );
}
