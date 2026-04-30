import fullClearanceImg from "@/assets/image/FullClearance.png";
import loanImg from "@/assets/image/Loan.png";
import payminImg from "@/assets/image/Paymin.png";
import canpreImg from "@/assets/image/Canpre.png";
import nodataImg from "@/assets/image/noData.png";
import goodImg from "@/assets/image/good.png";

export default function Statinfo({ advice, statusType }) {

  // =============================
  // 🧠 STATE CHECK
  // =============================
  const isEmpty = !advice;
  const isBeforeStart = statusType === "beforeStart";
  const isFuture = statusType === "future";
  const isNoDebt = statusType === "noDebt";
  const isFallback = advice?.is_fallback === true;
  const isDebtFreeGroup = advice?.group === "DEBT_FREE" || isNoDebt;

  // =============================
  // 🤖 PERSONA IMAGE
  // =============================
  const personaImages = {
    CAN_PAY_MINIMUM: payminImg,
    CAN_PREPAY: canpreImg,
    FULL_CLEARANCE: fullClearanceImg,
    LOAN_ROLLOVER: loanImg,
    DEBT_FREE: goodImg
  };

  // ✅ ใช้ nodata สำหรับ state พิเศษ
  const personaImage =
  isBeforeStart || isFuture || isEmpty || isFallback
    ? nodataImg
    : isDebtFreeGroup
    ? goodImg
    : advice?.group
    ? personaImages[advice.group]
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
      ? "ยังไม่มีข้อมูลสำหรับเดือนนี้ กรุณาเพิ่มข้อมูล"
      : isFallback
      ? "ระบบไม่สามารถวิเคราะห์คำแนะนำได้ในขณะนี้"
      : advice.financial_status;

  // =============================
  // 🔢 NORMALIZE DATA
  // =============================
  //const recommendedPayment = Number(advice?.recommended_payment ?? 0);
  //const remainingCash = Number(advice?.remaining_monthly_cash ?? 0);
  const recommendedPayment =
  advice?.recommended_payment != null
    ? Number(advice.recommended_payment)
    : null;

  const remainingCash =
    advice?.remaining_monthly_cash != null
      ? Number(advice.remaining_monthly_cash)
      : null;

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
                  : isFallback
                  ? "ระบบ AI ไม่สามารถวิเคราะห์ได้ (ลองใหม่อีกครั้ง)"
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
                : isFallback
                ? "-"
                : isNoDebt
                ? "0 ฿"
                : isEmpty || recommendedPayment == null
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
                : isFallback
                ? "-"
                : isNoDebt
                ? "0 ฿"
                : isEmpty || remainingCash == null
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
              )  : isEmpty ? (
                <>
                  <li>ยังไม่มีคำแนะนำในเดือนนี้</li>
                  <li>ลองเพิ่มข้อมูลรายรับ–รายจ่าย</li>
                </>
              ) : isFallback ? (
                <>
                  <li></li>
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
              ) : isFallback ? (
                <>
                  <li></li>
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