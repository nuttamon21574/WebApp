import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Sidebar from "../components/Sidebar/Sidebar";
import BNPLName from "../components/Header/BNPLName";
import EmptyBNPL from "../components/BNPL/EmptyBNPL";
import UploadPDF from "../components/BNPL/UploadPDF";
import ManualEntry from "../components/BNPL/ManualEntry";
import ModeSelector from "../components/BNPL/Mode";
import CheckBNPL from "../components/BNPL/CheckBNPL";
import BNPLProviderSelect from "../components/BNPL/BNPLProviderSelect";

import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function BNPL() {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== รับค่าจาก navigate state =====
  const startMode = location.state?.startMode || "empty";
  const startProvider = location.state?.provider || "SPayLater";

  const [mode, setMode] = useState(startMode);
  const [provider, setProvider] = useState(startProvider);
  const [showCheckBNPL, setShowCheckBNPL] = useState(false);
  const [checkingDebt, setCheckingDebt] = useState(true);

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

  // ===== LazPayLater → manual only =====
  useEffect(() => {
    if (provider === "LazPayLater" && mode === "pdf") {
      resetBNPLFlow();
      setMode("manual");
    }
  }, [provider, mode]);

  // ===== ✅ เช็คว่ามีหนี้แล้วหรือยัง =====
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCheckingDebt(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "bnplDebt", user.uid));

        if (snap.exists()) {
          const data = snap.data();

          const hasDebt =
            data.totalDebt > 0 ||
            data.outstandingBalance > 0 ||
            data.installments > 0;

          // ✅ ถ้ามีหนี้ → ไม่เข้า empty
          if (hasDebt && startMode === "empty") {
            setProvider("SPayLater"); // Shopee
            setMode("pdf");           // เข้าโหมด PDF
          }
        }
      } catch (err) {
        console.error("Check debt error:", err);
      }

      setCheckingDebt(false);
    });

    return () => unsub();
  }, [startMode]);

  // ===== กัน render ก่อนเช็คเสร็จ =====
  if (checkingDebt) {
    return <div className="text-white p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-full">
        
        {/* Sidebar */}
        <Sidebar activeTab="BNPL" />

        <div className="flex flex-col mt-10 lg:mt-0">
          <BNPLName />

          {/* Provider Select */}
          {(mode === "manual" || mode === "pdf") && (
            <div className="flex flex-col mb-4 gap-4">
              <BNPLProviderSelect
                value={provider}
                onChange={setProvider}
              />
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

            {/* Empty */}
            {mode === "empty" && (
              <EmptyBNPL
                onAdd={() => {
                  resetBNPLFlow();
                  setMode(
                    provider === "LazPayLater"
                      ? "manual"
                      : "pdf"
                  );
                }}
              />
            )}

            {/* Manual */}
            {mode === "manual" && (
              <ManualEntry
                onCancel={() => {
                  resetBNPLFlow();
                  setMode("empty");
                }}
                onSave={(data) => {
                  // ✅ mapping ให้ตรง ManualEntry
                  setForm({
                    total: data.totalDebt,
                    installments: data.installments,
                    monthly: data.monthlyPayment,
                    interest: data.interest,
                    dueDate: data.dueDate,
                  });

                  navigate("/dashboard");
                }}
              />
            )}

            {/* PDF */}
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
