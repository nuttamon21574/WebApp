import { useState, useEffect } from "react";

export default function PasswordInput({ length = 8, onChange }) {
  const [values, setValues] = useState(Array(length).fill(""));

  useEffect(() => {
    onChange?.(values.join(""));
  }, [values, onChange]);

  const handleChange = (e, idx) => {
    const val = e.target.value;

    // 🔹 กรณีลบ
    if (val === "") {
      const newValues = [...values];
      newValues[idx] = "";
      setValues(newValues);

      // โฟกัสย้อนกลับ
      if (idx > 0) {
        e.target.previousSibling?.focus();
      }
      return;
    }

    // 🔹 รับเฉพาะตัวเลข
    if (!/^[0-9]$/.test(val)) return;

    const newValues = [...values];
    newValues[idx] = val;
    setValues(newValues);

    // โฟกัสไปช่องถัดไป
    if (idx < length - 1) {
      e.target.nextSibling?.focus();
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      {values.map((v, i) => (
        <input
          key={i}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(e, i)}
          className="w-10 h-10 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      ))}
    </div>
  );
}
