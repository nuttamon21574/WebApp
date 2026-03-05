export default function RiskTier({ tier }) {

  const config = {
    low: {
      color: "bg-green-500",
      text: "LOW RISK",
    },
    medium: {
      color: "bg-yellow-500",
      text: "MEDIUM RISK",
    },
    high: {
      color: "bg-red-500",
      text: "HIGH RISK",
    },
    none: {
      color: "bg-gray-400",
      text: "NO DATA",
    }
  };

  const card = tier ? config[tier] : config.none;

  return (
    <div className={`${card.color} rounded-2xl p-8 text-white flex flex-col items-center justify-center shadow-lg`}>
      
      <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-xl font-bold mb-3 text-black">
        -
      </div>

      <p className="text-sm font-medium uppercase tracking-wider">
        {card.text}
      </p>

    </div>
  );
}