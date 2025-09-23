
import React from 'react';

interface StructureInputProps {
  value: string;
  onChange: (value: string) => void;
}

const StructureInput: React.FC<StructureInputProps> = ({ value, onChange }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Example:\n- Column 1: "CustomerID" (integer)\n- Column 2: "FullName" (string)\n- Column 3: "OrderDate" (YYYY-MM-DD)\n- Column 4: "Amount" (currency)`}
      rows={6}
      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
    />
  );
};

export default StructureInput;
