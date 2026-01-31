import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore"
import { auth, db } from "@/firebase"

import FormRow from "./FormRow"
import SaveButton from "../Button/SaveButton"

export default function FormContainer() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    gender: "",
    age: "",
    year: "",
    income: "",
    expense: "",
    spay: "",
    laz: "",
  })

  /* ---------------- โหลดข้อมูลเดิม ---------------- */
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const ref = doc(db, "users", user.uid)
        const snap = await getDoc(ref)

        if (snap.exists()) {
          const data = snap.data()
          setForm({
            gender: data.gender || "",
            age: data.age ?? "",
            year: data.year || "",
            income: data.income ?? "",
            expense: data.expense ?? "",
            spay: data.spay ?? "",
            laz: data.laz ?? "",
          })
        }
      } catch (err) {
        console.error("Load failed:", err)
      }
    }

    fetchUserData()
  }, [])

  /* ---------------- เช็คกรอกครบ ---------------- */
  const isComplete = Object.values(form).every(v => v !== "")

  /* ---------------- Save / Update ---------------- */
  const handleSave = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        alert("Please login first")
        return
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          ...form,
          age: Number(form.age),
          income: Number(form.income),
          expense: Number(form.expense),
          spay: Number(form.spay),
          laz: Number(form.laz)
        },
        { merge: true } // ⭐ สำคัญมาก (create + update ได้)
      )

      navigate("/bnpl")
    } catch (err) {
      console.error(err)
      alert("Failed to save data")
    }
  }

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

        {/* SPayLater */}
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

        {/* LazPayLater */}
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

      <div className="grid place-items-center h-full mt-10">
        <SaveButton
          isComplete={isComplete}
          onClick={handleSave}
        />
      </div>
    </div>
  )
}
