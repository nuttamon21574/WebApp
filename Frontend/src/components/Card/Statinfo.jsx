import fullClearanceImg from "@/assets/image/FullClearance.png";
import loanImg from "@/assets/image/Loan.png";
import payminImg from "@/assets/image/Paymin.png";
import canpreImg from "@/assets/image/Canpre.png";
import nodataImg from "@/assets/image/noData.png";

export default function Statinfo({ advice, statusType }) {

  // =============================
  // 🧠 STATE CHECK
  // =============================
  const isEmpty = !advice;
  const isBeforeStart = statusType === "beforeStart";
  const isFuture = statusType === "future";
  const isNoDebt = statusType === "noDebt";

  // =============================
  // 🤖 PERSONA IMAGE
  // =============================
  const personaImages = {
    CAN_PAY_MINIMUM: payminImg,
    CAN_PREPAY: canpreImg,
    FULL_CLEARANCE: fullClearanceImg,
    LOAN_ROLLOVER: loanImg
  };

  // ✅ ใช้ nodata สำหรับ state พิเศษ
  const personaImage =
  isBeforeStart || isFuture || isNoDebt || isEmpty
    ? nodataImg
    : advice?.strategy
    ? personaImages[advice.strategy]
    : null;
    
  // ✅ alt ปลอดภัย
  const imageAlt =
    isBeforeStart
      ? "before-start"
      : isFuture
      ? "future"
      : isNoDebt
      ? "no-debt"
      : isEmpty
      ? "no-data"
      : advice?.group;

  // =============================
  // 🔢 NORMALIZE DATA
  // =============================
  const recommendedPayment = Number(advice?.recommended_payment ?? 0);
  const remainingCash = Number(advice?.remaining_monthly_cash ?? 0);

  return (
    <div className="space-y-8">

      {/* ================= STATUS ================= */}
      <div className="grid md:grid-cols-3 gap-6 items-center">

        {/* 🤖 IMAGE */}
        <div className="flex justify-center order-1 md:order-2">
          {personaImage && (
            <img
              src={personaImage}
              alt={imageAlt}
              className="w-[180px] md:w-[220px] object-contain drop-shadow-xl"
            />
          )}
        </div>

        {/* 📊 STATUS CARD */}
        <div className="md:col-span-2 order-2 md:order-1">
          <div className="bg-gradient-to-br from-purple-300 to-white rounded-3xl p-8 md:p-12 shadow-xl">

            <h2 className="text-5xl font-semibold">
              Status
            </h2>

            <div className="pb-2 pt-4">
              <p className="text-xl md:text-2xl text-black">
                {isBeforeStart
                  ? "คุณยังไม่ได้เริ่มใช้งานในช่วงเดือนนี้"
                  : isFuture
                  ? "ยังไม่สามารถวิเคราะห์ล่วงหน้าได้"
                  : isNoDebt
                  ? "คุณไม่มีหนี้ในเดือนนี้ 🎉"
                  : isEmpty
                  ? "ยังไม่มีข้อมูลสำหรับเดือนนี้ กรุณาเพิ่มข้อมูล"
                  : advice.financial_status}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ================= CONTENT ================= */}
      <div className="space-y-8">

        {/* 💰 PAYMENT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <p className="text-2xl text-gray-500 text-center">
              Recommended Payment
            </p>

            <p className="text-5xl font-bold text-center">
              {isBeforeStart || isFuture
                ? "-"
                : isNoDebt
                ? "0 ฿"
                : isEmpty
                ? "-"
                : recommendedPayment.toLocaleString() + " ฿"}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <p className="text-2xl text-gray-500 text-center">
              Remaining Monthly Cash
            </p>

            <p className="text-5xl font-bold text-center">
              {isBeforeStart || isFuture
                ? "-"
                : isNoDebt
                ? "0 ฿"
                : isEmpty
                ? "-"
                : remainingCash.toLocaleString() + " ฿"}
            </p>
          </div>

        </div>

        {/* 📋 ACTIONS + BENEFITS */}
        <div className="grid md:grid-cols-2 gap-8">

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-semibold text-4xl mb-2">
              Actions
            </h3>

            <ul className="list-disc list-inside space-y-1 text-xl">
              {isBeforeStart ? (
                <li>คุณยังไม่ได้ใช้งานระบบในช่วงนี้</li>
              ) : isFuture ? (
                <li>ยังไม่สามารถสร้างคำแนะนำล่วงหน้าได้</li>
              ) : isNoDebt ? (
                <>
                  <li>คุณไม่มีภาระหนี้ในเดือนนี้</li>
                  <li>สามารถเริ่มวางแผนการออมได้</li>
                </>
              ) : isEmpty ? (
                <>
                  <li>ยังไม่มีคำแนะนำในเดือนนี้</li>
                  <li>ลองเพิ่มข้อมูลรายรับ–รายจ่าย</li>
                </>
              ) : advice.actions?.length > 0 ? (
                advice.actions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))
              ) : (
                <li>-</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-semibold text-4xl mb-3">
              Benefits
            </h3>

            <ul className="list-disc list-inside space-y-1 text-xl">
              {isBeforeStart ? (
                <li>เริ่มใช้งานเพื่อให้ระบบวิเคราะห์การเงินของคุณ</li>
              ) : isFuture ? (
                <li>ข้อมูลจะพร้อมเมื่อถึงเดือนนั้น</li>
              ) : isNoDebt ? (
                <>
                  <li>คุณมีสภาพคล่องทางการเงินที่ดี</li>
                  <li>สามารถวางแผนการลงทุนหรือออมเงินได้</li>
                </>
              ) : isEmpty ? (
                <>
                  <li>เมื่อมีข้อมูล ระบบจะช่วยวิเคราะห์การเงินของคุณ</li>
                  <li>เห็นภาพรวมการเงินชัดเจนขึ้น</li>
                </>
              ) : advice.benefits?.length > 0 ? (
                advice.benefits.map((item, index) => (
                  <li key={index}>{item}</li>
                ))
              ) : (
                <li>-</li>
              )}
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}