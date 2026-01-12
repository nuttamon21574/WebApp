export default function FormRow({ label, children }) {
  return (
    <div className="grid grid-cols-12 items-center bg-[#F1ECFF] px-6 py-4 rounded-2xl">
      
      {/* Label */}
      <span className="col-span-12 md:col-span-4 font-medium text-[#2B1166]">
        {label}
      </span>

      {/* Input / Select */}
      <div className="col-span-12 md:col-span-8">
        {children}
      </div>

    </div>
  );
}
