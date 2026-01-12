import { useRef, useState } from "react";
import PasswordInput from "../Input/Password";
import CancelButton from "../Button/CancelButton";
import UploadButton from "../Button/UploadButton";

export default function UploadPDF({ onCancel, onUpload }) {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const handleSelectFile = () => fileRef.current?.click();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") return alert("Please select a PDF file");
    setFile(selected);
  };

  const handleUpload = () => {
    if (!file) return alert("Please select PDF file first");
    if (password.length !== 8) return alert("Please enter PDF password");
    onUpload({ file, password });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg px-10 py-8 w-full max-w-xl mx-auto">
      <h2 className="text-xl font-semibold text-purple-700 text-center mb-4">
        Upload Report PDF
      </h2>

      {/* File name on top */}
      {file && (
        <div className="mb-3 text-center">
          <p className="text-xs text-gray-500">Selected file</p>
          <p className="text-sm font-medium text-gray-700 truncate">
            {file.name}
          </p>
        </div>
      )}

      {/* Upload box */}
      <div
        onClick={handleSelectFile}
        className="cursor-pointer border-2 border-dashed border-purple-400 rounded-xl
                   py-5 text-center text-purple-600 font-medium hover:bg-purple-50 transition"
      >
        <p className="text-base">
          {file ? "Change PDF File" : "Click to select PDF file"}
        </p>
      </div>

{/* Password */}
{file && (
  <div className="mt-6 px-2 sm:px-0">
    <p className="text-xs text-gray-600 mb-2 text-center sm:text-left">
      Password of PDF
    </p>

    <div className="w-full flex justify-center overflow-x-hidden">
      <div className="w-full max-w-xs sm:max-w-sm">
        <PasswordInput length={8} onChange={setPassword} />
      </div>
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

      {/* Buttons */}
      <div className="flex justify-center gap-6 mt-8">
        <CancelButton onCancel={onCancel} />
        <UploadButton
          label="Upload"
          onClick={handleUpload}
          disabled={!file || password.length !== 8}
        />
      </div>
    </div>
  );
}