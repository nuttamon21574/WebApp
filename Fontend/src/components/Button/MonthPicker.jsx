import { useEffect, useRef } from "react";
import { Datepicker } from "flowbite-datepicker";

export default function MonthPicker({
  id = "month-picker",
  placeholder = "Select month",
  value,
  onChange,
}) {
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    const handler = (e) => {
      onChange?.(e.detail.date);
    };

    pickerRef.current = new Datepicker(inputEl, {
      autohide: true,
      format: "MM yyyy",
      startView: 1,
      pickLevel: 1,
      theme: "light",
    });

    inputEl.addEventListener("changeDate", handler);

    return () => {
      if (inputEl) {
        inputEl.removeEventListener("changeDate", handler);
      }
      if (pickerRef.current) {
        pickerRef.current.destroy();
        pickerRef.current = null;
      }
    };
  }, [onChange]);

  return (
    <div className="month-picker-wrapper relative w-64">
      <input
        ref={inputRef}
        id={id}
        type="text"
        readOnly
        defaultValue={value}
        placeholder={placeholder}
        className="
          block w-full py-2.5
          text-center  placeholder:text-center font-semibold
          border border-gray-300 rounded-lg
          text-sm bg-white!
          focus:ring-purple-500 focus:border-purple-500
        "
      />
    </div>
  );
}
