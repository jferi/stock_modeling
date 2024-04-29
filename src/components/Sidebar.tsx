import React, { useContext, useEffect, useState } from "react";
import { SidebarItem, StockChartDataArray } from "../types";
import SearchBar from "./SearchBar";
import { useTheme } from "../contexts/ThemeContext";
import { invoke } from "@tauri-apps/api/tauri";
import ChartDataContext from "../contexts/ChartDataContext";

interface SidebarProps {
  items: SidebarItem[];
  chartData: any[];
  onRemove: (label: string) => void;
  addItem: (item: SidebarItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onRemove }) => {
  const { theme } = useTheme();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const { chartData, setChartData = () => {} } =
    useContext(ChartDataContext) || {};

  useEffect(() => {
    console.log(chartData);
  }, [chartData]);

  const handleAddItem = (item: SidebarItem): void => {
    setSidebarItems((prevItems) => {
      const exists = prevItems.some(
        (existingItem) => existingItem.label === item.label
      );
      if (!exists) {
        return [
          ...prevItems,
          {
            ...item,
            onClick: () => {
              invoke("fetch_stock_chart", { symbol: item.label }).then(
                (data: unknown) => {
                  const stockChartData = data as StockChartDataArray;
                  setChartData(stockChartData as StockChartDataArray);
                  console.log(chartData);
                }
              );
            }
          }
        ];
      }
      return prevItems;
    });
  };

  const handleRemoveItem = (label: string) => {
    setSidebarItems((prevItems) =>
      prevItems.filter((item) => item.label !== label)
    );
    onRemove(label);
  };

  const backgroundColorClass = theme === "dark" ? "bg-gray-800" : "bg-gray-200";
  const textColorClass = theme === "dark" ? "text-white" : "text-gray-800";
  const hoverBackgroundColorClass =
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300";

  return (
    <div className={` ${backgroundColorClass} ${textColorClass}`}>
      <SearchBar addItem={handleAddItem} />

      <ul className={` ${backgroundColorClass} ${textColorClass}`}>
        {sidebarItems.map((item) => (
          <li
            key={item.label}
            className={`flex justify-between px-4 py-2 cursor-pointer ${hoverBackgroundColorClass} ${backgroundColorClass} ${textColorClass}`}
            onClick={item.onClick}
          >
            {item.label}
            <span
              onClick={() => handleRemoveItem(item.label)}
              className="text-red-500 hover:text-red-600 cursor-pointer"
            >
              ✕
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
