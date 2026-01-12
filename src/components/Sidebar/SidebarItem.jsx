//แท็บด้านข้าง
export default function SidebarItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-4 rounded-xl font-semibold text-center
        transition-all duration-200

        ${
          active
            ? "bg-white! text-black!"
            : "bg-[#E9E1FF]! text-black! hover:bg-white!"
        }
      `}
    >
      {label}
    </button>
  );
}
