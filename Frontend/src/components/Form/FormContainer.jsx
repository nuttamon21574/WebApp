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
import IncreaseIncomeCard from "../Card/IncomeAdviceCard"

export default function FormContainer() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    //gender: "",
    age: "",
    year: "",
    income: "",
    expense: "",
    spaylater_limit: "",
    lazpaylater_limit: "",
  })

  const [showCard, setShowCard] = useState(false)
  const [ieRatio, setIeRatio] = useState(null)

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
            //gender: data.gender || "",
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
    //form.gender &&
    form.age !== "" &&
    form.year &&
    form.income !== "" &&
    form.expense !== "" &&
    form.spaylater_limit !== "" &&
    form.lazpaylater_limit !== ""

  /* ---------------- ฟังก์ชัน save จริง ---------------- */

  const saveData = async (riskTier) => {
  const user = auth.currentUser
  if (!user) return

  const income = Number(form.income)
  const expense = Number(form.expense)

  const balance = income - expense
  const total_limit =
    Number(form.spaylater_limit) +
    Number(form.lazpaylater_limit)

  // =========================
  // SAVE DATA
  // =========================
  await setDoc(
    doc(db, "users", user.uid),
    {
      ...form,
      income,
      expense,
      balance,
      total_limit,
      risk_tier: riskTier,
      updatedAt: new Date(),
    },
    { merge: true }
  )

  // =========================
  // 🔥 ADD THIS (no timeout)
  // =========================
  const getCurrentMonth = () => {
    const now = new Date()
    const thai = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    )

    return `${thai.getFullYear()}-${String(
      thai.getMonth() + 1
    ).padStart(2, "0")}`
  }

  const API_URL = "https://webapp-osky.onrender.com";
  await fetch(`${API_URL}/api/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid: user.uid,
      month: getCurrentMonth(), // ✅ สำคัญ
    }),
  })

  // =========================
  // 🚀 navigate AFTER AI
  // =========================
  // navigate("/BNPL")
}
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

    if (expense === 0) {
      alert("Expense cannot be 0")
      return
    }

    const ratio = income / expense
    setIeRatio(ratio)

    /* 🔥 CALCULATE RISK */
    let riskTier = "LOW"

    if (ratio <= 1) {
      riskTier = "HIGH"
    } else if (ratio <= 1.5) {
      riskTier = "MED"
    }

    /* popup */
    if (ratio <= 1) {
      setShowCard(true)
    }

    /* save */
    await saveData(riskTier)

    if (ratio > 1) {
      navigate("/BNPL")
    }

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

      {/* -------- Popup -------- */}

      {showCard && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <IncreaseIncomeCard
            ieRatio={ieRatio}
            onClose={() => {
            setShowCard(false) // ✅ แค่ปิด popup
          }}
          />
        </div>
      )}

    </div>
  )
}