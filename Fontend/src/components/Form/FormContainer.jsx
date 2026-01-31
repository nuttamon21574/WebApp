// ฟอร์มหน้ากรอกข้อมูลส่วนตัว
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FormRow from "./FormRow";
import SaveButton from "../Button/SaveButton";

export default function FormContainer() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    gender: "",
    age: "",
    year: "",
    income: "",
    expense: "",
    spay: "",
    laz: "",
  });

  // เช็คว่ากรอกครบ
  const isComplete =
    form.gender !== "" &&
    form.age !== "" &&
    form.year !== "" &&
    form.income !== "" &&
    form.expense !== "" &&
    form.spay !== "" &&
    form.laz !== "";

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
            onChange={(e) =>
              setForm({ ...form, gender: e.target.value })
            }
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </FormRow>

        {/* Age */}
        <FormRow label="Age">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.age}
            onChange={(e) =>
              setForm({ ...form, age: e.target.value })
            }
          />
        </FormRow>

        {/* College Year */}
        <FormRow label="College Year">
          <select
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.year}
            onChange={(e) =>
              setForm({ ...form, year: e.target.value })
            }
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
            onChange={(e) =>
              setForm({ ...form, income: e.target.value })
            }
          />
        </FormRow>

        {/* Expense */}
        <FormRow label="Expense">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.expense}
            onChange={(e) =>
              setForm({ ...form, expense: e.target.value })
            }
          />
        </FormRow>

        {/* SPayLater Limit */}
        <FormRow label="SPayLater Limit">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.spay}
            onChange={(e) =>
              setForm({ ...form, spay: e.target.value })
            }
          />
        </FormRow>

        {/* LazPayLater Limit */}
        <FormRow label="LazPayLater Limit">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.laz}
            onChange={(e) =>
              setForm({ ...form, laz: e.target.value })
            }
          />
        </FormRow>
      </div>

      {/* Save Button */}
      <div className="grid place-items-center h-full mt-10">
        <SaveButton
          isComplete={isComplete}
          onClick={() =>
            navigate("/bnpl", {
              state: form,
            })
          }
        />
      </div>
    </div>
  );
}
