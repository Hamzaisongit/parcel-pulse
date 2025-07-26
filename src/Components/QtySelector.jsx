//This component is to let the customer select how much quantity of a successfully scanned item is being assembled/packed
"use client"
import React, { useState } from "react";

const QtySelector = ({ initialQty = 1, min = 0, allMatchingItemsData, onDone }) => {
  const [qty, setQty] = useState(initialQty);

  const handleDecrement = () => {
    setQty((prev) => Math.max(min, prev - 1));
  };

  const handleIncrement = () => {
    setQty((prev) => Math.min(max, prev + 1));
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setQty(value === "" ? min : Math.max(min, Math.min(max, Number(value))));
  };

  const handleDone = () => {
    if (onDone) onDone(qty);
  };

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-64 flex flex-col items-center">
        <div className="flex items-center space-x-3 mb-6">
          <button
            className="w-10 h-10 rounded-full bg-gray-200 text-2xl flex items-center justify-center hover:bg-gray-300"
            onClick={handleDecrement}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <input
            type="text"
            className="w-16 text-center border border-gray-300 rounded text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={qty}
            onChange={handleInputChange}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <button
            className="w-10 h-10 rounded-full bg-gray-200 text-2xl flex items-center justify-center hover:bg-gray-300"
            onClick={handleIncrement}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          className="mt-2 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-lg font-semibold"
          onClick={handleDone}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default QtySelector;

