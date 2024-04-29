import React from "react";

export const ChartDataContext = React.createContext({
  chartData: null as any[] | null,
  setChartData: () => {}
});

export function useChartData() {
  const context = React.useContext(ChartDataContext);
  if (context === undefined) {
    throw new Error("useChartData must be used within a ChartDataProvider");
  }
  return context;
}
