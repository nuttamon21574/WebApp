import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import BNPLName from "../components/Header/BNPLName";
import BNPLDashboard from "../components/BNPL/BNPLDashboard";
import AddButton from "../components/Button/AddButton";

export default function BNPLDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Total BNPL");
  const [showAddButton, setShowAddButton] = useState(true);

  return (
    <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-full">
        <Sidebar activeTab="BNPL" />

        <div className="flex flex-col mt-10 lg:mt-0">
          <BNPLName />

          {showAddButton &&
            ["Total BNPL", "SPayLater", "LazPayLater"].includes(activeTab) && (
              <div className="fixed top-6 right-6 z-50">
                <AddButton onClick={() => navigate("/bnpl/add")} />
              </div>
            )}

          <div className="bg-white rounded-3xl p-8 h-screen overflow-auto">
            <BNPLDashboard
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
