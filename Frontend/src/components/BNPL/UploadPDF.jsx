import { useRef, useState } from "react";
import { auth, db } from "@/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { parse, format, isValid } from "date-fns";
import PasswordInput from "../Input/Password";
import UploadButton from "../Button/UploadButton";
import CheckBNPL from "./CheckBNPL";

export default function UploadPDF({ provider }) {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [contracts, setContracts] = useState([]);

  const fileRef = useRef(null);

  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";

    const d1 = parse(dateStr, "dd/MM/yyyy", new Date());
    const d2 = parse(dateStr, "MM/dd/yyyy", new Date());
    const finalDate = isValid(d1) ? d1 : isValid(d2) ? d2 : null;

    return finalDate ? format(finalDate, "dd/MM/yyyy") : "";
  };

  const buildUniqueKey = (providerKey, productName, purchaseDate) => {
    return `${providerKey}_${String(productName || "").trim()}_${normalizeDate(
      String(purchaseDate || "")
    )}`;
  };

  const syncLatestInvoiceItems = async (uid, providerKey, invoiceKeys) => {
    const currentSnap = await getDocs(
      collection(db, "bnplDebt", uid, "items")
    );

    const deletePromises = [];

    currentSnap.forEach((docSnap) => {
      const d = docSnap.data() || {};
      const currentProvider = String(d.provider || "").toLowerCase();
      const currentSource = String(d.source || "manual").toLowerCase();

      if (currentProvider !== providerKey.toLowerCase()) return;
      if (currentSource !== "pdf") return;

      const itemKey = d.uniqueKey
        ? String(d.uniqueKey)
        : buildUniqueKey(providerKey, d.productName, d.purchaseDate);

      if (!invoiceKeys.includes(itemKey)) {
        deletePromises.push(
          deleteDoc(doc(db, "bnplDebt", uid, "items", docSnap.id))
        );
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      const API_URL = "https://webapp-osky.onrender.com";
      await fetch(`${API_URL}/api/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid }),
      });
    }
  };

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

  const handleUpload = async () => {
    if (!file) return alert("Please select PDF file first");
    if (password.length !== 8) return alert("Please enter PDF password");

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("password", password);

    try {
      const API_URL = "https://webapp-osky.onrender.com";
      await fetch(`${API_URL}/api/calculate`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("🔥 BACKEND:", data);

      let finalContracts = [];

      if (data.data?.contracts) {
        finalContracts = data.data.contracts;
      } else if (Array.isArray(data.data)) {
        finalContracts = data.data;
      }

      if (finalContracts.length > 0) {
        const user = auth.currentUser;

        if (user && provider) {
          const invoiceKeys = finalContracts.map((contract) =>
            buildUniqueKey(provider, contract.productName, contract.purchaseDate)
          );

          await syncLatestInvoiceItems(user.uid, provider, invoiceKeys);
        }

        setContracts(finalContracts); // ✅ ส่งไป CheckBNPL
      } else {
        alert("No contract data found");
      }

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      alert("Cannot connect to backend");
    }
  };

  return (
    <div className="space-y-10">

      {contracts.length > 0 ? (
        <CheckBNPL contracts={contracts} />
      ) : (
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
            className="cursor-pointer border-2 border-dashed border-purple-400 rounded-xl py-5 text-center text-purple-600 font-medium hover:bg-purple-50"
          >
            {file ? "Change PDF File" : "Click to select PDF file"}
          </div>

          {file && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600 mb-2">
                Password of PDF
              </p>
              <PasswordInput length={8} onChange={setPassword} />
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex justify-center mt-8">
            <UploadButton
              label="Upload"
              onClick={handleUpload}
              disabled={!file || password.length !== 8}
            />
          </div>

        </div>
      )}

    </div>
  );
}