import { Dispatch, SetStateAction } from "react";

export const TIMESTAMPS = ["1M", "1H", "1D", "1WK"] as const;

export interface StockChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SidebarItem {
  label: string;
  onClick: () => void;
}

export type StockChartDataArray = StockChartData[];

export interface ChartDataContextType {
  chartData: StockChartDataArray;
  setChartData: Dispatch<SetStateAction<StockChartDataArray>>;
}
