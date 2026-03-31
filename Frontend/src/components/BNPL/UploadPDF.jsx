import { useRef, useState } from "react";
import { auth } from "../../firebase";

import PasswordInput from "../Input/Password";
import UploadButton from "../Button/UploadButton";
import SaveButton from "../Button/SaveButton";
import CancelButton from "../Button/CancelButton";

import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function UploadPDF() {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const fileRef = useRef(null);

  const handleSelectFile = () => fileRef.current?.click();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }

    setFile(selected);
  };

  /* ================= FORMAT DATE ================= */

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString("en-GB"); // 15/03/2026
  };

  /* ================= UPLOAD ================= */

  const handleUpload = async () => {
    if (!file) return alert("Please select PDF file first");
    if (password.length !== 8) return alert("Please enter PDF password");

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("password", password);

    try {
      const res = await fetch(`${API_URL}/api`, {
        method: "POST",
        body: formData,
      });

      const responseData = await res.json();

      if (!res.ok) {
        alert(responseData.error || "Upload failed");
        return;
      }

      let finalContracts = [];

      if (responseData.data?.contracts) {
        finalContracts = responseData.data.contracts;
      } else if (Array.isArray(responseData.data)) {
        finalContracts = responseData.data;
      }

      if (finalContracts.length > 0) {
        setContracts(finalContracts);

        setFile(null);
        setPassword("");
        if (fileRef.current) fileRef.current.value = "";

        alert("Upload success");
      } else {
        alert("No contract data found.");
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      alert("Cannot connect to backend");
    }
  };

  /* ================= SAVE TO FIRESTORE ================= */

  const handleSave = async () => {
    if (!contracts.length) return alert("No contracts to save");

    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        alert("Please login first");
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch(
        `${API_URL}/api/calculate/calculate-and-save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            provider: "SPayLater",
            items: contracts,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }

      alert("Saved successfully ✅");

      setContracts([]);
      navigate("/Dashboard");

    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= CANCEL ================= */

  const handleCancelAll = () => {
    setContracts([]);
    setFile(null);
    setPassword("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const formatValue = (val, isBaht) => {
    if (isBaht && typeof val === "number") {
      return val.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return val ?? "-";
  };

  const Field = ({ label, value, isBaht }) => (
    <div className="contents">
      <label className="md:col-span-4 font-medium text-gray-800 flex items-center min-h-[40px]">
        {label}
      </label>

      <div className="md:col-span-8 bg-gray-100 rounded-lg px-4 py-2 text-gray-800 flex justify-between items-center min-h-[40px]">
        <span className="truncate font-mono">
          {formatValue(value, isBaht)}
        </span>
        {isBaht && (
          <span className="ml-2 text-gray-500 text-xs uppercase">Baht</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">

      {/* ================= UPLOAD ================= */}
      {contracts.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg px-10 py-8 w-full max-w-xl mx-auto">
          <h2 className="text-xl font-semibold text-purple-700 text-center mb-4">
            Upload Report PDF
          </h2>

          {file && (
            <div className="mb-3 text-center">
              <p className="text-xs text-gray-500">Selected file</p>
              <p className="text-sm font-medium text-gray-700 truncate">
                {file.name}
              </p>
            </div>
          )}

          <div
            onClick={handleSelectFile}
            className="cursor-pointer border-2 border-dashed border-purple-400 rounded-xl py-5 text-center text-purple-600 font-medium hover:bg-purple-50 transition"
          >
            {file ? "Change PDF File" : "Click to select PDF file"}
          </div>

          {file && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600 mb-2">
                Password of PDF
              </p>
              <div className="w-full max-w-xs mx-auto">
                <PasswordInput length={8} onChange={setPassword} />
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex justify-center gap-6 mt-8">
            <UploadButton
              label="Upload"
              onClick={handleUpload}
              disabled={!file || password.length !== 8}
            />
          </div>
        </div>
      )}

      {/* ================= RESULT ================= */}
      {contracts.length > 0 && (
        <div className="w-full space-y-8">
          {contracts.map((contract, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm px-6 py-8 md:px-10"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="w-2 h-8 bg-purple-900 rounded-full"></div>
                <h2 className="text-lg font-semibold text-purple-900">
                  {contract.productName || `Contract #${index + 1}`}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-y-4 gap-x-8 text-sm">
                <Field label="Total Debt" value={contract.totalDebt} isBaht />
                <Field label="Outstanding Balance" value={contract.outstandingDebt} isBaht />
                <Field label="Monthly Payment" value={contract.monthlyInstallment} isBaht />
                <Field label="Total Installments" value={contract.totalInstallments} />
                <Field label="Interest Rate" value={`${contract.annualInterestRate || 0}%`} />
                <Field label="Payment Date" value={formatDate(contract.purchaseDate)} />
                <Field label="Due Date" value={formatDate(contract.dueDate)} />
              </div>
            </div>
          ))}

          <div className="flex justify-center gap-6 pt-4">
            <CancelButton onClick={handleCancelAll} />
            <SaveButton isComplete={!loading} onClick={handleSave} />
          </div>
        </div>
      )}
    </div>
  );
}