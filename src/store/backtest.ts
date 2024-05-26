import dayjs from "dayjs";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type BacktestState = {
  from: string;
  to: string;
  strategy: string;
  isValidDateRange: boolean;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
  setStrategy: (strategy: string) => void;
  setIsValidDateRange: (isValidDateRange: boolean) => void;
  validateDates: () => void;
};

const useBacktestState = create<BacktestState>()(
  immer((set, get) => ({
    from: "2023-01-01",
    to: "2024-01-01",
    strategy: "RSI + MACD",
    isValidDateRange: true,
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
    }
  }))
);

export { useBacktestState };
