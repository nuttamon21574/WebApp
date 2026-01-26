import SaveButton from "../Button/SaveButton";

export default function CheckBNPL({ form, onSave }) {

  const Field = ({ label, value, isBaht }) => (
    <>
      <label className="md:col-span-4 font-medium text-gray-800 flex items-center min-h-[40px]">
        {label}
      </label>

      <div className="md:col-span-8 bg-gray-100 rounded-lg px-4 py-2
                      text-gray-800 flex justify-between items-center min-h-[40px]">
        <span className="truncate">{value || ""}</span>
        <span className={`ml-2 text-gray-600 ${isBaht ? "opacity-100" : "opacity-0"}`}>
          Bath
        </span>
      </div>
    </>
  );

  return (
    <div className="mt-2 bg-white rounded-2xl shadow px-10 py-8 w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-y-5 gap-x-6 items-center text-sm">
        <Field label="Total Debt" value={form.total} isBaht />
        <Field label="Outstanding Debt Balance" value={form.monthly} isBaht />
        <Field label="Monthly Payment" value={form.monthly} isBaht />
        <Field label="Number of Installments" value={form.installments} />
        <Field label="Interest" value={form.interest} isBaht />
        <Field label="Payment Due Date" value={form.dueDate} />
      </div>

      <div className="flex justify-center mt-6">
        {/* อนุญาตให้กดได้เสมอ */}
        <SaveButton isComplete={true} onClick={onSave} />
      </div>
    </div>
  );
}
