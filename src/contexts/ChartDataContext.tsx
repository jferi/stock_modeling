import React, { ReactNode, createContext, useEffect, useState } from "react";
import { ChartDataContextType, StockChartDataArray } from "../types";

const ChartDataContext = createContext<ChartDataContextType | undefined>(
  undefined
);

export const ChartDataContextProvider: React.FC<{
  children: ReactNode;
}> = ({}) => {
  const [chartData, setChartData] = useState<StockChartDataArray>(null as any);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("fetch_stock_chart");
      const data = await response.json();
      setChartData(data);
    };

    fetchData();
  }, []);

  return (
    <ChartDataContext.Provider
      value={{ chartData, setChartData }}
    ></ChartDataContext.Provider>
  );
};

export default ChartDataContext;
