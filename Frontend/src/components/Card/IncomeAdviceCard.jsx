import OKButton from "../button/OKButton"
import Error_img from "../../assets/image/error.png"

export default function IncreaseIncomeCard({ ieRatio, onClose }) {

  const ratio = Number(ieRatio)

  let message = ""

  if (ratio <= 1) {
    message =
      "ควรหาช่องทางเพิ่มรายได้เพื่อให้การเงินสมดุลขึ้น"
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border w-full max-w-md">

      <div className="flex justify-center mb-4">
        <img
          src={Error_img}
          alt="Finance Advice"
          className="w-50 h-50 object-contain"
        />
      </div>

      <div className="flex justify-center mb-3">
        <h2 className="text-lg font-semibold text-center">
          หารายได้เพิ่ม
        </h2>
      </div>

      <p className="text-gray-600 text-sm mb-3 text-center">
        {message}
      </p>

      <div className="flex justify-center">
        <OKButton onClick={onClose} />
      </div>

    </div>
  )
}