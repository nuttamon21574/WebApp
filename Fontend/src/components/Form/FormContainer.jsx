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
    spaylater_limit: "",
    lazpaylater_limit: "",
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
            spaylater_limit: data.spaylater_limit ?? "",
            lazpaylater_limit: data.lazpaylater_limit ?? "",
          })
        }
      } catch (err) {
        console.error("Load failed:", err)
      }
    }

    fetchUserData()
  }, [])

  /* ---------------- เช็คกรอกครบ ---------------- */
  const isComplete =
    form.gender &&
    form.age !== "" &&
    form.year &&
    form.income !== "" &&
    form.expense !== "" &&
    form.spaylater_limit !== "" &&
    form.lazpaylater_limit !== ""

  /* ---------------- Save / Update ---------------- */
  const handleSave = async () => {
    const user = auth.currentUser
    if (!user) {
      alert("Please login first")
      return
    }

    if (!isComplete) {
      alert("Please fill all fields")
      return
    }

    try {
      const income = Number(form.income)
      const expense = Number(form.expense)

      if (isNaN(income) || isNaN(expense)) {
        alert("Income / Expense must be numbers")
        return
      }

      const balance = income - expense

      await setDoc(
        doc(db, "users", user.uid),
        {
          gender: form.gender,
          age: Number(form.age),
          year: form.year,

          income: Number(form.income),
          expense: Number(form.expense),
          spaylater_limit: Number(form.spaylater_limit),
          lazpaylater_limit: Number(form.lazpaylater_limit),

          balance: Number(form.income) - Number(form.expense),

          updatedAt: new Date(),
        },
        { merge: true }
      )

      navigate("/BNPL")
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

        <FormRow label="SPayLater Limit">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.spaylater_limit}
            onChange={(e) =>
              setForm({ ...form, spaylater_limit: e.target.value })
            }
          />
        </FormRow>

        <FormRow label="LazPayLater Limit">
          <input
            type="number"
            className="rounded-xl px-4 py-2 bg-white w-full"
            value={form.lazpaylater_limit}
            onChange={(e) =>
              setForm({ ...form, lazpaylater_limit: e.target.value })
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