import { useEffect, useState } from "react"
import { auth } from "@/firebase"
import { db } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

export default function UserName() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsername = async () => {
      const user = auth.currentUser

      if (!user) {
        setUsername("Guest")
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, "users", user.uid)
        const snap = await getDoc(userRef)

        if (snap.exists()) {
          setUsername(snap.data().username)
        } else {
          setUsername("User")
        }
      } catch (error) {
        console.error("Failed to fetch username:", error)
        setUsername("User")
      } finally {
        setLoading(false)
      }
    }

    fetchUsername()
  }, [])

  if (loading) {
    return (
      <p className="text-2xl md:text-3xl font-bold text-amber-50">
        HELLO...
      </p>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
      <p className="text-2xl md:text-3xl font-bold text-amber-50">
        HELLO, {username.toUpperCase()}
      </p>
    </div>
  )
}
