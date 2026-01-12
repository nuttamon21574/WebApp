// ฟอร์มหน้ากรอกข้อมูลส่วนตัว
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import FormRow from "./FormRow";
import SaveButton from "../Button/SaveButton";
import UploadButton from "../Button/UploadButton";
import CancelButton from "../Button/CancelButton";
import UploadCreditBureauPopup from "../popup/UploadCredit";

export default function FormContainer() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    gender: "",
    age: "",
    year: "",
    income: "",
    expenses: "",
    spay: "",
    laz: "",
    creditBureau: null,
    
  });
  
  const [password, setPassword] = useState("");

  const isComplete = Object.values(form).every(v => v !== "" && v !== null);
  
  const selectedFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setForm({ ...form, creditBureau: file });
    }}
  
    const handleSelectFile = () => {
      fileRef.current?.click();
    };
  
  return (
    <div>
      <h2 className="font-semibold mb-6 text-[#2B1166]">
        Fill your information
      </h2>

      <div className="space-y-4">
        {/* Gender */}
        <FormRow label="Gender">
          <select
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.gender}
            onChange={e => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>LGBTQ+</option>
          </select>
        </FormRow>

        {/* Age */}
        <FormRow label="Age">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.age}
            onChange={e => setForm({ ...form, age: e.target.value })}
          />
        </FormRow>

        {/* College Year */}
        <FormRow label="College Year">
          <select
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.year}
            onChange={e => setForm({ ...form, year: e.target.value })}
          >
            <option value="">Select</option>
            <option>Year 1</option>
            <option>Year 2</option>
            <option>Year 3</option>
            <option>Year 4</option>
            <option>Year 5</option>
            <option>Year 6</option>
          </select>
        </FormRow>

        {/* Income */}
        <FormRow label="Income">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.income}
            onChange={e => setForm({ ...form, income: e.target.value })}
          />
        </FormRow>

        {/* Expenses */}
        <FormRow label="Expenses">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.expenses}
            onChange={e => setForm({ ...form, expenses: e.target.value })}
          />
        </FormRow>

        {/* SPayLater Limit */}
        <FormRow label="SPayLater Limit">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.spay}
            onChange={e => setForm({ ...form, spay: e.target.value })}
          />
        </FormRow>

        {/* LazPayLater Limit */}
        <FormRow label="LazPayLater Limit">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.laz}
            onChange={e => setForm({ ...form, laz: e.target.value })}
          />
        </FormRow>
      

      {/* Credit Bureau Report */}
<FormRow label="Credit Bureau Report">
  <div className="flex items-center gap-4 w-full rounded-xl px-4 py-2 bg-white">
    
    {/* File name */}
    <span className="flex-1 text-sm text-gray-700 truncate">
      {file ? file.name : "No file selected"}
    </span>

    {/* Upload */}
    <UploadButton
      label="Upload"
      onClick={handleSelectFile}
    />

    {/* Cancel */}
    <CancelButton
      onClick={() => {
        setFile(null);
        setPassword("");
        setForm({ ...form, creditBureau: null });
        if (fileRef.current) fileRef.current.value = "";
      }}
    />

    {/* Hidden file input */}
    <input
      type="file"
      ref={fileRef}
      className="hidden"
      accept=".pdf"
      onChange={(e) => {
        selectedFile(e);
      }}
    />
  </div>
</FormRow>


        </div>
      {/* Save Button */}
      <div className="grid place-items-center h-full mt-10">
        <SaveButton
          isComplete={isComplete}
          onClick={() => navigate("/bnpl")}
        />
      </div>
</div>

  );
}
