import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import BNPLDashboard from "../components/BNPL/BNPLDashboard";
import AddButton from "../components/Button/AddButton";

export default function Dashboard() {
  const navigate = useNavigate();

  const [showAddButton, setShowAddButton] = useState(false);

  // ✅ ต้องตรงกับ Tabs
  const [activeTab, setActiveTab] = useState("Total BNPL");

  const [form, setForm] = useState({
    total: "",
    installments: "",
    monthly: "",
    interest: "",
    dueDate: "",
  });

  const handleAddClick = () => {
    const startMode = activeTab === "LazPayLater" ? "manual" : "pdf";

    navigate("/bnpl", {
      state: {
        startMode,
        provider: activeTab === "Total BNPL" ? "SPayLater" : activeTab,
      },
    });
  };

  return (
    <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-full">

        <Sidebar activeTab="Dashboard" />

        <div className="flex flex-col mt-10 lg:mt-0 relative">

          <div className="flex justify-between mb-6">
            <p className="text-3xl font-bold text-amber-50">
              Dashboard
            </p>
          </div>

          {/* ✅ ปุ่ม Add */}
          {showAddButton &&
            ["Total BNPL", "SPayLater", "LazPayLater"].includes(activeTab) && (
              <div className="fixed top-6 right-6 z-[999]">
                <AddButton onClick={handleAddClick} />
              </div>
          )}

          {/* MAIN */}
          <div className="bg-white rounded-3xl w-full p-6 lg:p-10 flex-1 overflow-auto shadow-2xl">
            <BNPLDashboard
              form={form}
              onShowAdd={setShowAddButton}
              activeTab={activeTab}
              onChangeTab={setActiveTab}
            />
          </div>

        </div>
      </div>
    </div>
  );
}