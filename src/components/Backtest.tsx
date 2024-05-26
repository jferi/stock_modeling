import clsx from "clsx";
import React, { useState } from "react";
import { useBacktestState } from "../store/backtest";
import { useTheme } from "../store/theme";

const strategies = ["RSI + MACD", "Triple EMA", "Alligator"];

const Backtest: React.FC = () => {
  const theme = useTheme();
  const from = useBacktestState((state) => state.from);
  const to = useBacktestState((state) => state.to);
  const strategy = useBacktestState((state) => state.strategy);
  const setFrom = useBacktestState((state) => state.setFrom);
  const setTo = useBacktestState((state) => state.setTo);
  const setStrategy = useBacktestState((state) => state.setStrategy);
  const isValidDateRange = useBacktestState((state) => state.isValidDateRange);
  const [isOpen, setIsOpen] = useState(false);
  const [animateError, setAnimateError] = useState(false);

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
        className={`px-4 py-2 rounded transition duration-150 ease-in-out ${theme.buttonBg} ${theme.buttonHoverBg} ${theme.textColor} border ${theme.borderColor}`}
        onClick={toggleDropdown}
      >
        Backtest Options
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-56 shadow-lg rounded-lg z-50 ${theme.dropdownBg} border ${theme.dropdownBorder}`}
        >
          <div className="p-4">
            <label className={`block mb-2 ${theme.dropdownText}`}>From:</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={`block w-full mt-1 px-3 py-2 ${theme.dropdownText} ${
                theme.dropdownBg
              } border ${
                isValidDateRange
                  ? theme.dropdownBorder
                  : theme.invalidBorderColor
              } rounded-md ${isValidDateRange ? "" : theme.invalidTextColor}`}
            />
            <label className={`block mb-2 ${theme.dropdownText}`}>To:</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={`block w-full mt-1 px-3 py-2 ${theme.dropdownText} ${
                theme.dropdownBg
              } border ${
                isValidDateRange
                  ? theme.dropdownBorder
                  : theme.invalidBorderColor
              } rounded-md ${isValidDateRange ? "" : theme.invalidTextColor}`}
            />
            <label className={`block mb-2 ${theme.dropdownText}`}>
              Strategy:
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className={`block w-full mt-1 px-3 py-2 ${theme.dropdownText} ${theme.dropdownBg} border ${theme.dropdownBorder} rounded-md`}
            >
              {strategies.map((strat) => (
                <option
                  key={strat}
                  value={strat}
                  className={`py-2 px-3 ${theme.dropdownText} ${theme.dropdownBg} hover:${theme.buttonHoverBg}`}
                >
                  {strat}
                </option>
              ))}
            </select>
            <button
              className={clsx(
                `mt-4 w-full px-4 py-2 rounded transition duration-150 ease-in-out ${theme.textColor} border ${theme.borderColor}`,
                animateError
                  ? `${theme.animationColor} animate-shake`
                  : `${theme.buttonBg} ${theme.buttonHoverBg}`
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
