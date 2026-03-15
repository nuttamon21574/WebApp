import OKButton from "../button/OKButton"
import Error_img from "../../assets/image/error.png"

export default function IncreaseIncomeCard({ onClose }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border w-full max-w-md">

    {/* รูป */}
      <div className="flex justify-center mb-4">
        <img
          src={Error_img}
          alt="Error"
          className="w-50 h-50 object-contain"
        />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold">
          หารายได้เพิ่ม
        </h2>
      </div>

      <p className="text-gray-600 text-sm mb-3">
        รายจ่ายของคุณค่อนข้างสูงเมื่อเทียบกับรายได้
        ลองเพิ่มช่องทางรายได้เพื่อช่วยให้การเงินสมดุลขึ้น
      </p>


      <div className="flex justify-center">
        <OKButton onClick={onClose} />
      </div>

    </div>
  )
}