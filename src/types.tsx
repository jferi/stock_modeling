import { Dispatch, SetStateAction } from "react";

export interface StockChartData {
  Day: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  };
  Intraday: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  };
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
