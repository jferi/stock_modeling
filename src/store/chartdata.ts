import { invoke } from "@tauri-apps/api/tauri";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { StockChartData, StockChartDataArray } from "../types";

type TState = {
  data: StockChartData[];
  setData: (data: StockChartDataArray, timeframe: string) => void;
  fetchData: (
    label: string,
    timeframe: string,
    period1: string,
    period2: string
  ) => Promise<void>;
};

const useChartData = create<TState>()(
  immer((set) => ({
    data: [],
    setData: (data) => {
      set((state) => {
        state.data = data.map((item) => ({
          ...item
        }));
      });
    },
    fetchData: async (label, timeframe, period1, period2) => {
      try {
        console.log(label, timeframe, period1, period2);
        const data = await invoke<StockChartData[]>("fetch_stock_chart", {
          symbol: label,
          timeframe: timeframe,
          period1: period1,
          period2: period2
        });
        const sortedData = data.sort((a, b) => a.time - b.time);
        set((state) => {
          state.data = sortedData.map((item) => ({
            ...item
          }));
        });
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
      }
    }
  }))
);

export { useChartData };
