import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useChartData } from "../store/chartdata";
import { useSidebarLabels } from "../store/sidebar";
import { useTimeStamp } from "../store/timestamp";
import SearchBar from "./SearchBar";

const Sidebar: React.FC = () => {
  const { theme } = useTheme();
  const labels = useSidebarLabels((state) => state.labels);
  const removeLabel = useSidebarLabels((state) => state.removeLabel);
  const timeframe = useTimeStamp((state) => state.timestamp);
  const period1 = useTimeStamp((state) => state.period1);
  const period2 = useTimeStamp((state) => state.period2);
  const fetchStockData = useChartData((state) => state.fetchData);

  const backgroundColorClass = theme === "dark" ? "bg-gray-800" : "bg-gray-200";
  const textColorClass = theme === "dark" ? "text-white" : "text-gray-800";
  const hoverBackgroundColorClass =
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300";

  return (
    <div className={` ${backgroundColorClass} ${textColorClass}`}>
      <h1 className="text-2xl font-bold p-4 text-center">Stocks</h1>
      <div className="w-3/4 mx-auto pb-4">
        <SearchBar />
      </div>

      <ul className={` ${backgroundColorClass} ${textColorClass}`}>
        {labels.map((label) => (
          <li
            key={label}
            className={`flex justify-between px-4 py-2 cursor-pointer ${hoverBackgroundColorClass} ${backgroundColorClass} ${textColorClass}`}
            onClick={async () => {
              fetchStockData(label, timeframe, period1, period2);
            }}
          >
            {label}
            <span
              onClick={(e) => {
                e.preventDefault();
                removeLabel(label);
              }}
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
