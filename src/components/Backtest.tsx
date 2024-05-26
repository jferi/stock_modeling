import { invoke } from "@tauri-apps/api/tauri";
import clsx from "clsx";
import React, { useState } from "react";
import { useBacktestState } from "../store/backtest";
import { useSidebarLabels } from "../store/labels";
import { useTheme } from "../store/theme";
import { StrategyResult } from "./utils/BacktestUtils";

const strategies = ["MACD", "Triple EMA", "Alligator"];

const Backtest: React.FC = () => {
  const theme = useTheme();
  const from = useBacktestState((state) => state.from);
  const to = useBacktestState((state) => state.to);
  const symbol = useSidebarLabels((state) => state.label);
  const strategy = useBacktestState((state) => state.strategy);
  const result = useBacktestState((state) => state.result);
  const setFrom = useBacktestState((state) => state.setFrom);
  const setTo = useBacktestState((state) => state.setTo);
  const setStrategy = useBacktestState((state) => state.setStrategy);
  const setResult = useBacktestState((state) => state.setResult);
  const isValidDateRange = useBacktestState((state) => state.isValidDateRange);
  const [isOpen, setIsOpen] = useState(false);
  const [animateError, setAnimateError] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleBacktest = async () => {
    if (isValidDateRange) {
      try {
        let result: StrategyResult;
        switch (strategy) {
          case "MACD":
            result = await invoke<StrategyResult>("macd_strategy", {
              symbol,
              timeframe: "1D",
              from,
              to,
              rsiPeriod: 14,
              macdShort: 12,
              macdLong: 26,
              macdSignal: 9
            });
            break;
          case "Triple EMA":
            result = await invoke<StrategyResult>("three_ema_strategy", {
              symbol,
              timeframe: "1D",
              from,
              to,
              period1: 5,
              period2: 10,
              period3: 20
            });
            break;
          case "Alligator":
            result = await invoke<StrategyResult>("alligator_strategy", {
              symbol,
              timeframe: "1D",
              from,
              to,
              period1: 5,
              period2: 8,
              period3: 13
            });
            break;
          default:
            throw new Error("Unsupported strategy");
        }
        setResult(result);
      } catch (error: any) {
        setError(error.message);
        setAnimateError(true);
        setTimeout(() => setAnimateError(false), 1000);
      }
    } else {
      setError("Invalid date range");
      setAnimateError(true);
      setTimeout(() => setAnimateError(false), 1000);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex">
        <button
          className={`px-4 py-2 rounded transition duration-150 ease-in-out ${theme.buttonBg} ${theme.buttonHoverBg} ${theme.textColor} border ${theme.borderColor}`}
          onClick={() => setIsOpen((prevIsOpen) => !prevIsOpen)}
        >
          Backtest Options
        </button>
      </div>
      {isOpen && (
        <div
          className={`dropdown-menu absolute mt-2 w-72 shadow-lg z-50 rounded-lg ${theme.dropdownBg} border ${theme.dropdownBorder}`}
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
            <div className="mt-4">
              <h2
                className={`text-xl font-semibold mb-2 ${theme.dropdownText}`}
              >
                Strategy Results
              </h2>
              <p className={theme.dropdownText}>
                Number of Trades: {result.num_trades}
              </p>
              <p className={theme.dropdownText}>
                Winning Trades: {result.winning_trades}
              </p>
              <p className={theme.dropdownText}>
                Losing Trades: {result.losing_trades}
              </p>
              <p className={theme.dropdownText}>
                Winning Percentage: {result.winning_percentage.toFixed(2)}%
              </p>
              <p className={theme.dropdownText}>
                Profit Factor: {result.profit_factor.toFixed(2)}
              </p>
              <p className={theme.dropdownText}>
                Final Capital: ${result.final_capital.toFixed(2)}
              </p>
              <p className={theme.dropdownText}>
                Total Return Percentage:{" "}
                {result.total_return_percentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className={clsx("error", { animate: animateError })}>{error}</div>
      )}
    </div>
  );
};

export default Backtest;
