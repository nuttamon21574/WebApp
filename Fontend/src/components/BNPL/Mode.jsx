import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/firebase"

export default function ModeSelector({ mode, provider, onChange }) {

  const handleSelect = async (selectedMode) => {
    onChange(selectedMode)

    try {
      const user = auth.currentUser
      if (!user) return

      await setDoc(
        doc(db, "manualDebt", user.uid),
        {
          entryMode: selectedMode
        },
        { merge: true }
      )

      console.log("Saved mode:", selectedMode)

    } catch (err) {
      console.error("Save mode failed:", err)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6 w-full">

      {/* Upload PDF — SPayLater เท่านั้น */}
      {provider === "SPayLater" && (
        <button
          type="button"
          onClick={() => handleSelect("pdf")}
          className={`col-span-2 sm:col-span-1
            grid grid-cols-[16px_1fr] items-start gap-3 px-5 py-3 rounded-2xl border w-full
            ${mode === "pdf" ? "border-purple-600 bg-purple-50" : "border-gray-300 bg-white"}`}
        >
          <span
            className={`w-4 h-4 rounded-full grid place-items-center border mt-1
              ${mode === "pdf" ? "border-purple-600" : "border-gray-400"}`}
          >
            {mode === "pdf" && (
              <span className="w-2 h-2 rounded-full bg-purple-600" />
            )}
          </span>

          <span
            className={`text-sm font-medium text-left
              ${mode === "pdf" ? "text-purple-900" : "text-gray-600"}`}
          >
            Upload PDF
          </span>
        </button>
      )}

      {/* Manual Entry */}
      <button
        type="button"
        onClick={() => handleSelect("manual")}
        className={`col-span-2 sm:col-span-1
          grid grid-cols-[16px_1fr] items-start gap-3 px-5 py-3 rounded-2xl border w-full
          ${mode === "manual" ? "border-purple-600 bg-purple-50" : "border-gray-300 bg-white"}`}
      >
        <span
          className={`w-4 h-4 rounded-full grid place-items-center border mt-1
            ${mode === "manual" ? "border-purple-600" : "border-gray-400"}`}
        >
          {mode === "manual" && (
            <span className="w-2 h-2 rounded-full bg-purple-600" />
          )}
        </span>

        <span
          className={`text-sm font-medium text-left
            ${mode === "manual" ? "text-purple-900" : "text-gray-600"}`}
        >
          Manual Entry
        </span>
      </button>

    </div>
  )
}
