// CustomCheckbox.jsx
import React from "react";
import { Check, AlertCircle } from "lucide-react";

const CustomCheckbox = ({ checked, onChange, children, error }) => {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded-md border border-gray-300 bg-white checked:bg-orange-500 checked:border-orange-500 hover:border-orange-400 hover:shadow-md"
          />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 peer-checked:opacity-100 text-white">
            <Check className="h-3 w-3 mb-1" strokeWidth={3} />
          </span>
        </div>
        <span className="text-sm text-gray-700 mb-1.5">{children}</span>
      </label>
      {error && (
        <p className="text-sm flex items-center gap-1 ml-8 text-red-500">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export default CustomCheckbox;
