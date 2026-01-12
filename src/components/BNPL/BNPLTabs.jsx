// components/BNPL/BNPLTabs.jsx
export default function BNPLTabs({ activeTab, onChange }) {
  const tabs = ["Total BNPL", "SPayLater", "LazPayLater"];

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2 sm:gap-4 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap
              ${
                activeTab === tab
                  ? "!bg-purple-900 !text-white"
                  : "!bg-white !text-black border border-gray-300 hover:!bg-gray-100"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
