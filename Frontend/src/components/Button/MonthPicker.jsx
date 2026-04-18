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

  // =============================
  // 🇹🇭 GET CURRENT MONTH
  // =============================
  const getThaiCurrentMonth = () => {
    const now = new Date();
    const thai = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );

    return `${thai.getFullYear()}-${String(
      thai.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  // =============================
  // 🧠 FORMAT DISPLAY
  // =============================
  const formatDisplay = (date) => {
    return date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // =============================
  // 🚀 INIT DATEPICKER (ครั้งเดียว)
  // =============================
  useEffect(() => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    const handler = (e) => {
      const selected = e.detail.date;
      if (!selected) return;

      const monthKey = `${selected.getFullYear()}-${String(
        selected.getMonth() + 1
      ).padStart(2, "0")}`;

      onChange?.(monthKey);
    };

    pickerRef.current = new Datepicker(inputEl, {
      autohide: true,
      format: "MM yyyy",
      startView: 1,
      pickLevel: 1,
    });

    inputEl.addEventListener("changeDate", handler);

    return () => {
      inputEl.removeEventListener("changeDate", handler);
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
  }, []);

  // =============================
  // 🔄 SYNC VALUE (สำคัญสุด)
  // =============================
  useEffect(() => {
    const inputEl = inputRef.current;
    const picker = pickerRef.current;

    if (!inputEl || !picker) return;

    const monthToUse = value || getThaiCurrentMonth();
    const [year, month] = monthToUse.split("-");
    const date = new Date(year, month - 1);

    // 🔥 set UI
    inputEl.value = formatDisplay(date);

    // 🔥 set datepicker state
    picker.setDate(date);

  }, [value]);useEffect(() => {
  const inputEl = inputRef.current;
  const picker = pickerRef.current;

  if (!inputEl || !picker) return;

  const highlightSelected = () => {
    const [year, month] = (value || getThaiCurrentMonth()).split("-");
    const selectedMonthIndex = Number(month) - 1;

    const cells = document.querySelectorAll(".datepicker-cell");

    cells.forEach((el, index) => {
      el.classList.remove("bg-purple-500", "text-white");

      if (index === selectedMonthIndex) {
        el.classList.add(
          "bg-purple-500",
          "text-white",
          "rounded",
          "font-semibold"
        );
      }
    });
  };

  // 🔥 trigger ตอน popup เปิด
  inputEl.addEventListener("show", highlightSelected);

  return () => {
    inputEl.removeEventListener("show", highlightSelected);
  };
}, [value]);

  // =============================
  // 🎨 BORDER STATE
  // =============================
  const currentMonth = getThaiCurrentMonth();
  const activeMonth = value || currentMonth;

  return (
    <div className="relative w-64">
      <input
        ref={inputRef}
        id={id}
        type="text"
        readOnly
        placeholder={placeholder}
        className={`
          block w-full py-2.5
          text-center font-semibold
          border rounded-lg text-sm bg-white
          focus:ring-purple-500 focus:border-purple-500
          
          ${
            activeMonth === currentMonth
              ? "border-purple-600 ring-2"
              : "border-gray-300"
          }
        `}
      />
    </div>
  );
}