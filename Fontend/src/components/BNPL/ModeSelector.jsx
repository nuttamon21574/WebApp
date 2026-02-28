import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore"

import { auth, db } from "@/firebase"
import { useEffect, useRef } from "react"

export default function ModeSelector({ mode, provider, onChange }) {

  // 🔥 กัน auto ยิงซ้ำหลายรอบ
  const hasAutoSet = useRef(false)

  /* ============================= */
  /* AUTO MODE BASED ON PROVIDER  */
  /* ============================= */

  useEffect(() => {
    if (!provider) return
    if (hasAutoSet.current) return

    if (provider === "SPayLater") {
      handleSelect("pdf")
      hasAutoSet.current = true
    }

    if (provider === "LazPayLater") {
      handleSelect("manual")
      hasAutoSet.current = true
    }

  }, [provider])

  /* ============================= */
  /* HANDLE MODE SELECT            */
  /* ============================= */

  const handleSelect = async (selectedMode) => {

    if (!provider) return
    if (mode === selectedMode) return

    console.log("🔥 SELECT MODE:", selectedMode)

    // อัปเดต state ก่อน
    onChange(selectedMode)

    try {
      const user = auth.currentUser
      if (!user) return

      const providerRef = doc(
        db,
        "bnplDebt",
        user.uid,
        "providers",
        provider
      )

      await setDoc(
        providerRef,
        {
          mode: selectedMode,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )

      console.log("✅ Mode saved to Firestore:", selectedMode)

    } catch (err) {
      console.error("❌ Save mode failed:", err)
    }
  }

  /* ============================= */
  /* BUTTON COMPONENT              */
  /* ============================= */

  const ModeButton = ({ value, label }) => (
    <button
      type="button"
      onClick={() => handleSelect(value)}
      className={`
        col-span-2 sm:col-span-1
        flex items-center gap-3
        p-4 rounded-xl w-full
        transition-all duration-300 ease-out
        active:scale-[0.98]
        ${mode === value
          ? "bg-purple-50 shadow-md"
          : "bg-white shadow-sm hover:shadow-md"}
      `}
    >
      <div className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-100">
        <div
          className={`
            w-3 h-3 rounded-full transition-all duration-300 ease-out
            ${mode === value
              ? "bg-purple-600 scale-100"
              : "bg-transparent scale-0"}
          `}
        />
      </div>

      <span className="text-lg font-semibold">
        {label}
      </span>
    </button>
  )

  /* ============================= */
  /* RENDER                        */
  /* ============================= */

  return (
    <div className="grid grid-cols-2 gap-6 w-full">

      {provider === "SPayLater" && (
        <ModeButton value="pdf" label="Upload PDF" />
      )}

      <ModeButton value="manual" label="Manual Entry" />

    </div>
  )
}