//หน้า BNPL ที่ผู้ใช้ใหม่จะเห้น

import AddBNPLButton from "../Button/AddBNPLButton";

export default function EmptyBNPL({ onAdd, disabled }) {
  return (
    <div className="h-full grid place-items-center">
      <div className="bg-white rounded-3xl shadow-xl px-10 py-12 w-full max-w-md grid grid-cols-4 gap-y-6 text-center">

        {/* Title */}
        <h2 className="col-span-4 text-xl font-semibold text-gray-800">
          No BNPL Found
        </h2>

        {/* Subtitle */}
        <p className="col-span-4 text-gray-500">
          You haven’t added any Buy Now Pay Later yet
        </p>

        {/* Action */}
        <div className="col-span-4 flex justify-center pt-2">
          <AddBNPLButton onClick={onAdd} disabled={disabled} />
        </div>

      </div>
    </div>
  );
}
