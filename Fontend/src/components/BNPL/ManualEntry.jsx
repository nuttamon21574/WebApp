import { useState } from "react";
import CancelButton from "../Button/CancelButton";
import SaveButton from "../Button/SaveButton";

export default function ManualEntry({ onCancel, onSave }) {
  const [form, setForm] = useState({
    provider: "",
    totalDue: "",
    installments: "",
    monthlyPayment: "",
    interest: "",
    startDate: "",
    dueDate: "",
    paidInstallments: "",
    status: "on_time",
    monthlyIncome: "",
    otherDebts: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isComplete =
    form.totalDue &&
    form.installments &&
    form.monthlyPayment &&
    form.interest &&
    form.startDate &&
    form.dueDate;

  const handleSave = () => {
    if (!isComplete) return;
    onSave?.(form); // ส่งข้อมูลไป parent
    // ❌ ไม่ต้อง navigate เพราะ parent จะ setMode("dashboard")
  };

  return (
    <div className="space-y-10">
      <section>
        <h3 className="font-semibold mb-6">Debt Details</h3>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="col-span-2">
            <h4 className="font-semibold text-gray-800 mb-2">Total Due (THB)</h4>
            <input
              name="totalDue"
              value={form.totalDue}
              onChange={handleChange}
              placeholder="Enter total amount"
              className="w-full border rounded-xl px-4 py-3 bg-white outline-none"
            />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Installments</h4>
            <input
              name="installments"
              value={form.installments}
              onChange={handleChange}
              placeholder="Number of installments"
              className="w-full border rounded-xl px-4 py-3 bg-white outline-none"
            />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Monthly Payment (THB)</h4>
            <input
              name="monthlyPayment"
              value={form.monthlyPayment}
              onChange={handleChange}
              placeholder="Enter monthly payment"
              className="w-full border rounded-xl px-4 py-3 bg-white outline-none"
            />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Interest (%)</h4>
            <input
              name="interest"
              value={form.interest}
              onChange={handleChange}
              placeholder="Enter interest"
              className="w-full border rounded-xl px-4 py-3 bg-white outline-none"
            />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Start Date</h4>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 bg-white outline-none"
            />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Due Date</h4>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 bg-white outline-none"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-center gap-8">
        <CancelButton onCancel={onCancel} />
        <SaveButton isComplete={isComplete} onClick={handleSave} />
      </div>
    </div>
  );
}