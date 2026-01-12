// ปุ่มหน้า BNPL สำหรับผู้ใช้ใหม่

export default function AddBNPLButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: '#6B21A8', color: 'white' }}
      className="px-6 py-3 rounded-xl hover:bg-[#5B1D91] transition-colors"
    >
      Add BNPL
    </button>
  );
}
