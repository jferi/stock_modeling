import { invoke } from "@tauri-apps/api/tauri";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { StockChartData, StockChartDataArray } from "../types";
import { useTimeStamp } from "./timestamp";

type TState = {
  data: StockChartData[];
  setData(data: StockChartDataArray): void;
  fetchData(label: string): Promise<void>;
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
    fetchData: async (label) => {
      try {
        const data = await invoke<StockChartData[]>("fetch_stock_chart", {
          symbol: label,
          timeframe: useTimeStamp.getState().timestamp
        });
        const sortedData = data.sort((a, b) => a.time - b.time);
        set((state) => {
          state.data = sortedData.map((item) => ({
            ...item
          }));
        });
      } catch (error) {
        console.log("reached end of data");
      }
    }
  }))
);

export { useChartData };
