// ฟอร์มหน้ากรอกข้อมูลส่วนตัว
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import FormRow from "./FormRow";
import SaveButton from "../Button/SaveButton";

export default function FormContainer() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    gender: "",
    age: "",
    year: "",
    income: "",

    // แยกค่าใช้จ่าย
    rent: "",
    food: "",
    transport: "",
    other: "",

    spay: "",
    laz: "",
    creditBureau: null,
  });

  // รวมค่าใช้จ่ายทั้งหมด
  const totalExpenses =
    (Number(form.rent) || 0) +
    (Number(form.food) || 0) +
    (Number(form.transport) || 0) +
    (Number(form.other) || 0);

  // เช็คว่ากรอกครบ
  const isComplete =
    form.gender !== "" &&
    form.age !== "" &&
    form.year !== "" &&
    form.income !== "" &&

    // expenses
    form.rent !== "" &&
    form.food !== "" &&
    form.transport !== "" &&
    form.other !== "" &&

    // BNPL
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

      {/* Expense Section */}
      <div className="rounded-2xl p-4 bg-[#F1ECFF]">
        <h3 className="font-medium text-[#2B1166] mb-4">
          Expenses
        </h3>

        {/* Rent */}
        <FormRow label="- Rent">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.rent}
            onChange={(e) =>
              setForm({ ...form, rent: e.target.value })
            }
          />
        </FormRow>

        {/* Food */}
        <FormRow label="- Food">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.food}
            onChange={(e) =>
              setForm({ ...form, food: e.target.value })
            }
          />
        </FormRow>

        {/* Transport */}
        <FormRow label="- Transport">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.transport}
            onChange={(e) =>
              setForm({ ...form, transport: e.target.value })
            }
          />
        </FormRow>

        {/* Other Expenses */}
        <FormRow label="- Other Expenses">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.other}
            onChange={(e) =>
              setForm({ ...form, other: e.target.value })
            }
          />
        </FormRow>
      </div>


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
              state: {
                ...form,
                expenses: totalExpenses,
              },
            })
          }
        />
      </div>
    </div>
  );
}
