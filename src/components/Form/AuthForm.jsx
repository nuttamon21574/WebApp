import { useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth } from "@/firebase"
import { useNavigate } from "react-router-dom"
import InputForm from "./InputForm"
import SubmitButton from "../Button/SubmitButton"

export default function AuthForm({ type = "login" }) {
  const isRegister = type === "register"
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const [errors, setErrors] = useState({})
  const [isPending, setIsPending] = useState(false)

  /* -------------------- helpers -------------------- */
  const clearFieldError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const handleChange = (field, setter) => (e) => {
    setter(e.target.value)
    clearFieldError(field)
  }

  /* -------------------- validation -------------------- */
  const validateRegister = () => {
    const newErrors = {}

    if (!username) newErrors.username = "Username is required"
    else if (username.length < 4 || username.length > 10)
      newErrors.username = "Username must be 4–10 characters"

    if (!email) newErrors.email = "Email is required"

    if (!password) newErrors.password = "Password is required"
    else if (password.length < 8 || password.length > 13)
      newErrors.password = "Password must be 8–13 characters"

    if (!confirm) newErrors.confirm = "Confirm Password is required"
    else if (password !== confirm)
      newErrors.confirm = "Passwords do not match"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateLogin = () => {
    const newErrors = {}

    if (!email) newErrors.email = "Email is required"
    if (!password) newErrors.password = "Password is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /* -------------------- submit -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault()

    const isValid = isRegister
      ? validateRegister()
      : validateLogin()

    if (!isValid) return

    try {
      setIsPending(true)

      /* ---------- REGISTER ---------- */
      if (isRegister) {
        const userCredential =
          await createUserWithEmailAndPassword(auth, email, password)

        await sendEmailVerification(userCredential.user)

        alert(
          "Verification email has been sent.\n" +
          "Please verify your email before logging in."
        )

        navigate("/")
        return
      }

      /* ---------- LOGIN ---------- */
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      const user = userCredential.user

      if (!user.emailVerified) {
        const shouldResend = window.confirm(
          "Your account has not been verified yet.\n\n" +
          "Please verify your email before logging in.\n\n"
        )

        if (shouldResend) {
          await sendEmailVerification(user)
          alert(
            "Verification email has been resent.\n" +
            "Please check your inbox or spam folder."
          )
        }

        return
      }

      navigate("/my-account")

    } catch (err) {
      const newErrors = {}

      if (isRegister) {
        if (err.code === "auth/email-already-in-use") {
          newErrors.email = "Email already in use"
        } else if (err.code === "auth/weak-password") {
          newErrors.password = "Password is too weak"
        } else {
          newErrors.email = "Registration failed"
        }
      } else {
        if (err.code === "auth/invalid-credential") {
          newErrors.email = "Email or password is incorrect"
        } else {
          newErrors.email = "Login failed"
        }
      }

      setErrors(newErrors)
    } finally {
      setIsPending(false)
    }
  }

  /* -------------------- reset password -------------------- */
  const handleResetPassword = async () => {
    if (!email) {
      setErrors({ email: "Please enter your email" })
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      alert("Password reset email sent. Please check your inbox or spam.")
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setErrors({ email: "Email not found" })
      } else if (err.code === "auth/invalid-email") {
        setErrors({ email: "Invalid email format" })
      } else if (err.code === "auth/too-many-requests") {
        setErrors({ email: "Too many requests. Try again later." })
      } else {
        setErrors({ email: "Failed to send reset email" })
      }
    }
  }

  return (
    <form
      className="flex flex-col gap-3 mt-6"
      onSubmit={handleSubmit}
      noValidate
    >
      {isRegister && (
        <InputForm
          id="username"
          label="Username"
          value={username}
          onChange={handleChange("username", setUsername)}
          error={errors.username}
        />
      )}

      <InputForm
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={handleChange("email", setEmail)}
        error={errors.email}
      />

      <InputForm
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={handleChange("password", setPassword)}
        error={errors.password}
      />

{!isRegister && (
      <p className="text-sm text-left text-gray-600">
  Forgot your password?
  <span
    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1"
      onClick={() => {
    console.log("CLICKED RESET PASSWORD")
    handleResetPassword()
  }}
  >
    Click here!
  </span>
</p>
)}

      {isRegister && (
        <InputForm
          id="confirm"
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={handleChange("confirm", setConfirm)}
          error={errors.confirm}
        />
      )}

      <SubmitButton disabled={isPending} />
    </form>
  )
}
