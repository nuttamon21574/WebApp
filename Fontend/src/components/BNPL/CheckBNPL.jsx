import SaveButton from "../Button/SaveButton";

export default function CheckBNPL({ form, onChange, onSave }) {
  const isComplete =
    form.total &&
    form.installments &&
    form.monthly &&
    form.interest &&
    form.dueDate;

  return (
    <div className="mt-2 bg-white rounded-2xl shadow px-10 py-8 w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-y-5 gap-x-6 items-center text-sm">

        <label className="md:col-span-4 font-medium">Total Due Amount</label>
        <input
          type="number"
          name="total"
          value={form.total}
          onChange={onChange}
          className="md:col-span-8 bg-gray-100 rounded-lg px-4 py-2 outline-none"
        />

        <label className="md:col-span-4 font-medium">Number of Installments</label>
        <input
          type="number"
          name="installments"
          value={form.installments}
          onChange={onChange}
          className="md:col-span-8 bg-gray-100 rounded-lg px-4 py-2 outline-none"
        />

        <label className="md:col-span-4 font-medium">Balance / month</label>
        <div className="md:col-span-8 flex items-center gap-2">
          <input
            type="number"
            name="monthly"
            value={form.monthly}
            onChange={onChange}
            className="flex-1 bg-gray-100 rounded-lg px-4 py-2 outline-none"
          />
          <span className="text-gray-500">Baht</span>
        </div>

        <label className="md:col-span-4 font-medium">Interest</label>
        <div className="md:col-span-8 flex items-center gap-2">
          <input
            type="number"
            name="interest"
            value={form.interest}
            onChange={onChange}
            className="flex-1 bg-gray-100 rounded-lg px-4 py-2 outline-none"
          />
          <span className="text-gray-500">Baht</span>
        </div>

        <label className="md:col-span-4 font-medium">Payment Due Date</label>
        <input
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={onChange}
          className="md:col-span-8 bg-gray-100 rounded-lg px-4 py-2 outline-none"
        />
      </div>

      <div className="flex justify-center mt-6">
        <SaveButton isComplete={isComplete} onClick={onSave} />
      </div>
    </div>
  );
}
