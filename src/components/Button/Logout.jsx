import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1️⃣ ล้างข้อมูล auth (ปรับตามระบบของคุณ)
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 2️⃣ redirect ไปหน้า Login
    navigate("/", { replace: true });
  };

  return (
    
    <button
      type="button"
      onClick={handleLogout}
      className="
        w-full
        px-4 py-2
        mb-6
        rounded-lg
        text-sm font-medium
        text-white
        bg-red-500 hover:bg-red-600
        transition-colors duration-150
        focus:outline-none! focus:ring-0! shadow-none!
      "
    >
<svg className="w-6 h-6 text-white dark:text-red" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h11m0 0-4-4m4 4-4 4m-5 3H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h3"/>
</svg>
    </button>
  );
}
