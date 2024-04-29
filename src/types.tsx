export interface StockChartData {
  time: string;
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
  setChartData: (data: StockChartDataArray) => void;
}
