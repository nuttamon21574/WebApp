import { useState, useEffect } from "react"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/firebase"

export default function BNPLProviderSelect({ value, onChange }) {
  const options = ["SPayLater", "LazPayLater"]
  const [open, setOpen] = useState(false)

  // ✅ set default provider = SPayLater ถ้า DB ยังไม่มี
  useEffect(() => {
    const initDefaultProvider = async () => {
      const user = auth.currentUser
      if (!user) return

      const ref = doc(db, "bnplDebt", user.uid)
      const snap = await getDoc(ref)

      if (!snap.exists() || !snap.data()?.bnplProvider) {
        await setDoc(
          ref,
          {
            bnplProvider: "SPayLater",
            bnplProviderUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        onChange("SPayLater")
        console.log("Initialized provider → SPayLater")
      } else {
        // ✅ ถ้ามีค่าแล้ว → sync กลับไป parent
        onChange(snap.data().bnplProvider)
      }
    }

    initDefaultProvider()
  }, [])

  const handleSelect = async (opt) => {
    onChange(opt)
    setOpen(false)

    try {
      const user = auth.currentUser
      if (!user) return

      await setDoc(
        doc(db, "bnplDebt", user.uid),
        {
          bnplProvider: opt,
          bnplProviderUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      console.log("Saved provider:", opt)

    } catch (err) {
      console.error("Save provider failed:", err)
    }
  }

  return (
    <div className="relative w-56">

      {/* Selected */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full !bg-[#CDBDFF] text-black px-4 py-2 rounded-xl
                   flex items-center justify-between font-medium"
      >
        {value || "SPayLater"}
        <span className={`transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute mt-2 w-full bg-[#CDBDFF] rounded-xl overflow-hidden shadow-lg z-10">
          {options.map((opt) => {
            const isActive = value === opt

            return (
              <div
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`
                  px-4 py-2 text-center cursor-pointer transition
                  ${isActive ? "bg-white font-semibold" : "hover:bg-white"}
                `}
              >
                {opt}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
