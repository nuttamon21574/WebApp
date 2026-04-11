import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Sidebar from "../components/Sidebar/Sidebar";
import BNPLName from "../components/Header/BNPLName";
import EmptyBNPL from "../components/BNPL/EmptyBNPL";
import UploadPDF from "../components/BNPL/UploadPDF";
import ManualEntry from "../components/BNPL/ManualEntry";
import ModeSelector from "../components/BNPL/ModeSelector";
import CheckBNPL from "../components/BNPL/CheckBNPL";
import BNPLProviderSelect from "../components/BNPL/BNPLProviderSelect";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function BNPL() {
  const navigate = useNavigate();
  const location = useLocation();

  const startMode = location.state?.startMode || "pdf";
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

  useEffect(() => {
    if (provider === "LazPayLater" && mode === "pdf") {
      resetBNPLFlow();
      setMode("manual");
    }
  }, [provider, mode]);

  // ✅ FIX: check debt
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCheckingDebt(false);
        return;
      }

      try {
        const snap = await getDocs(
          collection(db, "debts", user.uid, "items")
        );

        let hasDebt = false;

        snap.forEach((doc) => {
          const data = doc.data();

          if (
            data.totalDebt > 0 ||
            data.outstandingBalance > 0 ||
            data.installments > 0
          ) {
            hasDebt = true;
          }
        });

        if (hasDebt && startMode === "empty") {
          setProvider("SPayLater");
          setMode("pdf");
        }
      } catch (err) {
        console.error("Check debt error:", err);
      }

      setCheckingDebt(false);
    });

    return () => unsub();
  }, [startMode]);

  if (checkingDebt) {
    return <div className="text-white p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-full">
        
        <Sidebar activeTab="BNPL" />

        <div className="flex flex-col mt-10 lg:mt-0">
          <BNPLName />

          {(mode === "manual" || mode === "pdf") && (
            <div className="flex flex-col mb-4 gap-4">
              <BNPLProviderSelect
                value={provider}
                onChange={setProvider}
              />
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 h-screen flex flex-col gap-6 overflow-auto">
            
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

            {mode === "manual" && (
              <ManualEntry
                provider={provider}
                onCancel={() => {
                  resetBNPLFlow();
                  setMode("empty");
                }}
                onSave={(data) => {
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

            {mode === "pdf" && (
              <div className="flex flex-col gap-10">
                <UploadPDF
                  provider={provider}
                  onCancel={() => {
                    resetBNPLFlow();
                    setMode("empty");
                  }}
                  onUpload={() => setShowCheckBNPL(true)}
                />

                {showCheckBNPL && (
                <CheckBNPL
                  contracts={[
                    {
                      productName: provider,
                      totalDebt: Number(form.total),
                      outstandingDebt: Number(form.total),
                      monthlyInstallment: Number(form.monthly),
                      totalInstallments: Number(form.installments),
                      annualInterestRate: Number(form.interest),
                      purchaseDate: form.dueDate,
                    },
                  ]}
                  onSave={async () => {
                    const user = auth.currentUser;
                    if (!user) return;

                    try {
                      await addDoc(
                        collection(db, "debts", user.uid, "items"),
                        {
                          totalDebt: Number(form.total),
                          outstandingBalance: Number(form.total),
                          monthlyInstallment: Number(form.monthly),
                          installments: Number(form.installments),
                          interestRate: Number(form.interest),
                          dueDate: form.dueDate,
                          provider: provider,
                          createdAt: new Date(),
                        }
                      );

                      console.log("✅ Saved to Firebase");
                      navigate("/dashboard");

                    } catch (err) {
                      console.error("❌ Save error:", err);
                    }
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