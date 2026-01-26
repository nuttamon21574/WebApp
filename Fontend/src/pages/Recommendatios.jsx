import Sidebar from "../components/Sidebar/Sidebar";
import Cardclass from "../components/Card/Cardclass.jsx";
import MonthPicker from "../components/Button/MonthPicker.jsx";
import Statinfo from "../components/Card/Statinfo.jsx";

export default function Recommendations() {
  return (
    <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-full">
    
            <Sidebar activeTab="Recommendations" />
    
              <div className="flex flex-col mt-10 lg:mt-0">
              <p className="text-2xl md:text-3xl font-bold text-amber-50">
                Recommendation
                </p>
                <div className="mt-4 mb-8"><MonthPicker/></div>

              <div className="bg-white rounded-3xl p-10 py-4 w-full">
                <div className="flex flex-col md:flex-col gap-6">
                <Statinfo />
                <Statinfo />
                </div>
              </div>
              </div>
    
          </div>
        </div>
  );
}
