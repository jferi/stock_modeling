import dayjs from "dayjs";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { StrategyResult } from "../components/utils/BacktestUtils";

type BacktestState = {
  from: string;
  to: string;
  strategy: string;
  isValidDateRange: boolean;
  result: StrategyResult;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
  setStrategy: (strategy: string) => void;
  setIsValidDateRange: (isValidDateRange: boolean) => void;
  validateDates: () => void;
  setResult: (result: StrategyResult) => void;
};

const useBacktestState = create<BacktestState>()(
  immer((set, get) => ({
    from: "2023-01-01",
    to: "2024-01-01",
    strategy: "MACD",
    isValidDateRange: true,
    result: {
      signals: [],
      dates: [],
      num_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      winning_percentage: 0,
      profit_factor: 0,
      final_capital: 0,
      total_return_percentage: 0
    },
    setFrom: (from) => {
      set((state) => {
        state.from = from;
      });
      get().validateDates();
    },
    setTo: (to) => {
      set((state) => {
        state.to = to;
      });
      get().validateDates();
    },
    setStrategy: (strategy) =>
      set((state) => {
        state.strategy = strategy;
      }),
    setIsValidDateRange: (isValidDateRange) =>
      set((state) => {
        state.isValidDateRange = isValidDateRange;
      }),
    validateDates: () => {
      const { from, to } = get();
      const startDate = dayjs(from);
      const endDate = dayjs(to);
      const diffMonths = endDate.diff(startDate, "month");

      set((state) => {
        state.isValidDateRange = diffMonths >= 3;
      });
    },
    setResult: (result) =>
      set((state) => {
        state.result = result;
      })
  }))
);

export { useBacktestState };
