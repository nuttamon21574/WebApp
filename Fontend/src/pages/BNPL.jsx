import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar/Sidebar";
import BNPLName from "../components/Header/BNPLName";
import EmptyBNPL from "../components/BNPL/EmptyBNPL";
import UploadPDF from "../components/BNPL/UploadPDF";
import ManualEntry from "../components/BNPL/ManualEntry";
import ModeSelector from "../components/BNPL/Mode";
import CheckBNPL from "../components/BNPL/CheckBNPL";
import BNPLProviderSelect from "../components/BNPL/BNPLProviderSelect";

export default function BNPL() {
  const navigate = useNavigate(); // ✅ ใช้สำหรับ redirect

  const [mode, setMode] = useState("empty");
  const [provider, setProvider] = useState("SPayLater");
  const [showCheckBNPL, setShowCheckBNPL] = useState(false);

  const [form, setForm] = useState({
    total: "",
    installments: "",
    monthly: "",
    interest: "",
    dueDate: "",
  });

  const resetBNPLFlow = () => {
    setShowCheckBNPL(false);
    setForm({
      total: "",
      installments: "",
      monthly: "",
      interest: "",
      dueDate: "",
    });
  };

  // LazPayLater → manual only
  useEffect(() => {
    if (provider === "LazPayLater" && mode !== "dashboard") {
      resetBNPLFlow();
      setMode("manual");
    }
  }, [provider]);

  return (
    <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-full">
        
        {/* Sidebar */}
        <Sidebar activeTab="BNPL" />

        <div className="flex flex-col mt-10 lg:mt-0">
          <BNPLName />

          {/* Provider Select (เฉพาะ manual / pdf) */}
          {(mode === "manual" || mode === "pdf") && (
            <div className="flex flex-col mb-4 gap-4">
              <BNPLProviderSelect value={provider} onChange={setProvider} />
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 h-screen flex flex-col gap-6 overflow-auto">
            
            {/* Mode Selector */}
            {mode !== "empty" && (
              <ModeSelector
                mode={mode}
                provider={provider}
                onChange={(m) => {
                  resetBNPLFlow();
                  setMode(m);
                }}
              />
            )}

            {/* Empty State */}
            {mode === "empty" && (
              <EmptyBNPL
                onAdd={() => {
                  resetBNPLFlow();
                  setMode(provider === "LazPayLater" ? "manual" : "pdf");
                }}
              />
            )}

            {/* Manual Entry */}
            {mode === "manual" && (
              <ManualEntry
                onCancel={() => {
                  resetBNPLFlow();
                  setMode("empty");
                }}
                onSave={(data) => {
                  setForm({
                    total: data.totalDue,
                    installments: data.installments,
                    monthly: data.monthlyPayment,
                    interest: data.interest,
                    dueDate: data.dueDate,
                  });

                  // ✅ SAVE เสร็จ → ไป Dashboard
                  navigate("/dashboard");
                }}
              />
            )}

            {/* PDF Upload */}
            {mode === "pdf" && (
              <div className="flex flex-col gap-10">
                <UploadPDF
                  onCancel={() => {
                    resetBNPLFlow();
                    setMode("empty");
                  }}
                  onUpload={() => setShowCheckBNPL(true)}
                />

                {showCheckBNPL && (
                  <CheckBNPL
                    form={form}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [e.target.name]: e.target.value,
                      }))
                    }
                    onSave={() => {
                      // ✅ Confirm PDF → ไป Dashboard
                      navigate("/dashboard");
                    }}
                  />
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
