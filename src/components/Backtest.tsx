import clsx from "clsx";
import { useAtomValue } from "jotai";
import React, { useState } from "react";
import { themeAtom } from "../store/atoms";
import { useBacktestState } from "../store/backtest";

const strategies = ["RSI + MACD", "Triple EMA", "Alligator"];

const Backtest: React.FC = () => {
  const theme = useAtomValue(themeAtom);
  const from = useBacktestState((state) => state.from);
  const to = useBacktestState((state) => state.to);
  const strategy = useBacktestState((state) => state.strategy);
  const setFrom = useBacktestState((state) => state.setFrom);
  const setTo = useBacktestState((state) => state.setTo);
  const setStrategy = useBacktestState((state) => state.setStrategy);
  const isValidDateRange = useBacktestState((state) => state.isValidDateRange);
  const [isOpen, setIsOpen] = useState(false);
  const [animateError, setAnimateError] = useState(false);

  const buttonBg = theme === "dark" ? "bg-gray-700" : "bg-gray-300";
  const buttonHoverBg =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-400";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300";
  const dropdownBg = theme === "dark" ? "bg-gray-800" : "bg-white";
  const dropdownText = theme === "dark" ? "text-white" : "text-gray-800";
  const dropdownBorder =
    theme === "dark" ? "border-gray-700" : "border-gray-300";
  const invalidBorderColor = "border-red-600";
  const invalidTextColor = "text-red-600";
  const animationColor =
    theme === "dark"
      ? "bg-red-500 hover:bg-red-500"
      : "bg-red-300 hover:bg-red-300";

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  const handleBacktest = () => {
    if (isValidDateRange) {
      console.log("Backtest initiated");
    } else {
      setAnimateError(true);
      setTimeout(() => setAnimateError(false), 500);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        className={`px-4 py-2 rounded transition duration-150 ease-in-out ${buttonBg} ${buttonHoverBg} ${textColor} border ${borderColor}`}
        onClick={toggleDropdown}
      >
        Backtest Options
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-56 shadow-lg rounded-lg z-50 ${dropdownBg} border ${dropdownBorder}`}
        >
          <div className="p-4">
            <label className={`block mb-2 ${dropdownText}`}>From:</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={`block w-full mt-1 px-3 py-2 ${dropdownText} ${dropdownBg} border ${
                isValidDateRange ? dropdownBorder : invalidBorderColor
              } rounded-md ${isValidDateRange ? "" : invalidTextColor}`}
            />
            <label className={`block mb-2 ${dropdownText}`}>To:</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={`block w-full mt-1 px-3 py-2 ${dropdownText} ${dropdownBg} border ${
                isValidDateRange ? dropdownBorder : invalidBorderColor
              } rounded-md ${isValidDateRange ? "" : invalidTextColor}`}
            />
            <label className={`block mb-2 ${dropdownText}`}>Strategy:</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className={`block w-full mt-1 px-3 py-2 ${dropdownText} ${dropdownBg} border ${dropdownBorder} rounded-md`}
            >
              {strategies.map((strat) => (
                <option
                  key={strat}
                  value={strat}
                  className={`py-2 px-3 ${dropdownText} ${dropdownBg} hover:${buttonHoverBg}`}
                >
                  {strat}
                </option>
              ))}
            </select>
            <button
              className={clsx(
                `mt-4 w-full px-4 py-2 rounded transition duration-150 ease-in-out ${textColor} border ${borderColor}`,
                animateError
                  ? `${animationColor} animate-shake`
                  : `${buttonBg} ${buttonHoverBg}`
              )}
              onClick={handleBacktest}
              onAnimationEnd={() => setAnimateError(false)}
            >
              <span className="text-lg">Backtest</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backtest;
