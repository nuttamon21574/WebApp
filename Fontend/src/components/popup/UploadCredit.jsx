import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CancelButton from "../Button/CancelButton";
import UploadButton from "../Button/UploadButton";
import PasswordInput from "../Input/Password";

export default function UploadCreditBureauPopup({ open, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  if (!open) return null;

  const isUploadDisabled = file === null || password.length < 8;

  const handleUpload = () => {
    if (isUploadDisabled) return;
    onUpload({ file, password });
    navigate("/bnpl");
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">

        <PasswordInput length={8} value={password} onChange={setPassword} />

        <label className="w-full mb-6 flex justify-between border rounded-lg p-2 cursor-pointer bg-gray-50">
          <span className={file ? "" : "text-gray-400"}>
            {file?.name || "Select a PDF file"}
          </span>
          <input
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <div className="flex justify-end gap-3">
          <CancelButton
            onClick={() => {
              setFile(null);
              setPassword("");
              onClose();
            }}
          />

          <UploadButton
            label="Upload"
            disabled={isUploadDisabled}
            onClick={handleUpload}
          />
        </div>

      </div>
    </div>
  );
}
