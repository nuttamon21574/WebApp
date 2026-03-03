import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Statinfo() {
  return (
    <div className="space-y-8">

      {/* 🔮 Main Recommendation Card */}
      <div className="bg-gradient-to-br from-purple-300 to-white rounded-3xl p-14 shadow-xl">
        <h2 className="text-xl font-semibold">
        Status
        </h2>
        <div className="pb-10 pt-5">
        <p className="text-black/80">
        -
        </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* 🤖 AI Bot */}
        <div className="rounded-l flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/44c310e7-4de4-45dc-a3dc-7df7ab9e7210/eMFuITyaLp.lottie"
            loop
            autoplay
            style={{ width: "480px", height: "450px" }}
          />
        </div>

        {/* 📊 Right Side Cards */}
        <div className="md:col-span-2 space-y-6">

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <p className="text-sm text-gray-500">Recommended Payment</p>
              
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <p className="text-sm text-gray-500">Remaining Monthly Cash</p>
              
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-semibold text-lg mb-2">Action</h3>
            <p className="text-sm text-black/80">
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-semibold text-lg mb-3">Benefits</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}