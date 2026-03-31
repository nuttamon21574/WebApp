import { useState } from "react";
import { auth } from "@/firebase";

import SaveButton from "../Button/SaveButton";
import AddManual from "../Button/AddManual";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parse, format } from "date-fns";

import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

/* =======================================================
   MAIN COMPONENT
======================================================= */

export default function ManualEntry({ onSave, provider }) {

  const navigate = useNavigate();

  /* -------------------- Initial State -------------------- */

  const emptyItem = {
    productName: "",
    purchaseDate: "",
    dueDate: "",
    totalDebt: "",
    annualInterestRate: "",
    totalInstallments: "",
    monthlyInstallment: "",
    outstandingDebt: "",
  };

  const [items, setItems] = useState([emptyItem]);

  /* -------------------- Validation -------------------- */

  const isItemComplete = (item) =>
    item.productName.trim() !== "" &&
    item.purchaseDate &&
    item.dueDate &&
    item.totalDebt !== "" &&
    item.annualInterestRate !== "" &&
    item.totalInstallments !== "" &&
    item.monthlyInstallment !== "" &&
    item.outstandingDebt !== "" &&
    parseInt(item.totalInstallments) > 0;

  const lastItemComplete = isItemComplete(items[items.length - 1]);
  const isComplete = items.every(isItemComplete);

  /* -------------------- Handlers -------------------- */

  const handleChange = (index, e) => {

    const { name, value } = e.target;

    setItems((prev) => {
      const updated = [...prev];
      updated[index][name] = value;
      return updated;
    });

  };

  const addItem = () => {

    if (!lastItemComplete) {
      alert("Please complete the current product before adding a new one.");
      return;
    }

    setItems((prev) => [...prev, { ...emptyItem }]);

  };

  const removeItem = (index) => {

    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length ? updated : [emptyItem]);

  };

  /* -------------------- Save -------------------- */

  const handleSave = async () => {

    try {

      const user = auth.currentUser;

      if (!user) {
        alert("Please login first");
        return;
      }

      const token = await user.getIdToken(true);
      const uid = user.uid;

      const response = await fetch(
        `${API_URL}/api/calculate/calculate-and-save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            provider,
            items,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      /* Persona */

      const personaResponse = await fetch(
        `${API_URL}/api/persona/${uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const personaData = await personaResponse.json();

      if (!personaResponse.ok) {
        throw new Error(personaData.error || "Persona failed");
      }

      console.log("Persona:", personaData.persona);

      alert("Saved successfully!");
      navigate("/dashboard");

    } catch (err) {

      console.error("SAVE ERROR:", err);
      alert(err.message);

    }

  };

  /* -------------------- UI -------------------- */

  return (

    <div className="space-y-10">

      {items.map((item, index) => (

        <div
          key={index}
          className="border rounded-2xl p-8 bg-gray-50"
        >

          {/* Header */}

          <div className="flex justify-between mb-6">

            <h3 className="font-semibold text-lg">
              Product {index + 1}
            </h3>

            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            )}

          </div>

          {/* Form */}

          <div className="grid grid-cols-2 gap-6 text-sm">

            <TextField
              label="Product Name"
              name="productName"
              value={item.productName}
              onChange={(e) => handleChange(index, e)}
            />

            <DateField
              label="Purchase Date"
              name="purchaseDate"
              value={item.purchaseDate}
              onChange={(e) => handleChange(index, e)}
            />

            <DateField
              label="Latest Payment Due Date"
              name="dueDate"
              value={item.dueDate}
              onChange={(e) => handleChange(index, e)}
            />

            <NumberField
              label="Total Debt"
              name="totalDebt"
              value={item.totalDebt}
              onChange={(e) => handleChange(index, e)}
              step="0.01"
              unit="Baht"
            />

            <NumberField
              label="Annual Interest Rate"
              name="annualInterestRate"
              value={item.annualInterestRate}
              onChange={(e) => handleChange(index, e)}
              step="0.01"
              unit="%"
            />

            <div>
              <h4 className="mb-2 font-medium text-gray-700">
                Total Installments
              </h4>

              <select
                name="totalInstallments"
                value={item.totalInstallments}
                onChange={(e) => handleChange(index, e)}
                className="w-full border rounded-xl px-4 py-3"
              >
                <option value="">Select installment plan</option>
                <option value="1">1 month</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="9">9 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
              </select>
            </div>

            <NumberField
              label="Monthly Installment"
              name="monthlyInstallment"
              value={item.monthlyInstallment}
              onChange={(e) => handleChange(index, e)}
              step="0.01"
              min="0"
              unit="Baht"
            />

            <NumberField
              label="Outstanding Debt"
              name="outstandingDebt"
              value={item.outstandingDebt}
              onChange={(e) => handleChange(index, e)}
              step="0.01"
              min="0"
              unit="Baht"
            />

          </div>

        </div>

      ))}

      {/* Add */}

      <div className="flex justify-end">

        <AddManual
          onClick={addItem}
          text="Add Product"
          disabled={!lastItemComplete}
        />

      </div>

      {/* Save */}

      <div className="flex justify-center gap-8">

        <SaveButton
          isComplete={isComplete}
          onClick={handleSave}
        />

      </div>

    </div>

  );

}

/* =======================================================
   FIELD COMPONENTS
======================================================= */

function TextField({ label, name, value, onChange }) {

  return (

    <div>

      <h4 className="mb-2 font-medium text-gray-700">
        {label}
      </h4>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border rounded-xl px-4 py-3"
      />

    </div>

  );

}

/* Number Field */

function NumberField({
  label,
  name,
  value,
  onChange,
  step = "1",
  min = "0",
  unit = ""
}) {

  return (

    <div>

      <h4 className="mb-2 font-medium text-gray-700">
        {label}
      </h4>

      <div className="relative">

        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          step={step}
          min={min}
          className="w-full border rounded-xl px-4 py-3 pr-20"
        />

        {unit && (
          <span className="absolute right-4 top-3 text-gray-500 text-sm">
            {unit}
          </span>
        )}

      </div>

    </div>

  );

}

/* Date Field */

function DateField({ label, name, value, onChange }) {

  const selectedDate = value
    ? parse(value, "dd/MM/yyyy", new Date())
    : null;

  const handleChangeDate = (date) => {

    if (!date) {
      onChange({
        target: { name, value: "" },
      });
      return;
    }

    const formatted = format(date, "dd/MM/yyyy");

    onChange({
      target: { name, value: formatted },
    });

  };

  return (

    <div>

      <h4 className="mb-2 font-medium text-gray-700">
        {label}
      </h4>

      <DatePicker
        selected={selectedDate}
        onChange={handleChangeDate}
        dateFormat="dd/MM/yyyy"
        placeholderText="dd/mm/yyyy"
        wrapperClassName="w-full"
        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        yearDropdownItemNumber={20}
        scrollableYearDropdown
        isClearable
      />

    </div>

  );

}