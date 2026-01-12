import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import BNPLDashboard from "../components/BNPL/BNPLDashboard";
import AddButton from "../components/Button/AddButton";

export default function Dashboard() {
  const navigate = useNavigate();

  const [showAddButton, setShowAddButton] = useState(false);
  const [activeTab, setActiveTab] = useState("Total BNPL");

  const [form, setForm] = useState({
    total: "",
    installments: "",
    monthly: "",
    interest: "",
    dueDate: "",
  });

  return (
    <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-full">

        {/* Sidebar */}
        <Sidebar activeTab="Dashboard" />

        {/* Main Content */}
        <div className="flex flex-col mt-10 lg:mt-0">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <p className="text-2xl md:text-3xl font-bold text-amber-50">
              Dashboard
            </p>
          </div>

          {/* Add Button (fixed overlay) */}
          {showAddButton &&
            ["Total BNPL", "SPayLater", "LazPayLater"].includes(activeTab) && (
              <div className="fixed top-6 right-6 z-50">
                <AddButton onClick={() => navigate("/bnpl")} />
              </div>
            )}

          {/* Card Container */}
          <div className="bg-white rounded-3xl w-full p-4 sm:p-6 lg:p-10 flex-1 overflow-auto">
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
