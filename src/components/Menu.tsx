import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useChartData } from "../store/chartdata";
import { useSidebarLabels } from "../store/sidebar";
import { useTimeStamp } from "../store/timestamp";

const Menu: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const setTimeStamp = useTimeStamp((state) => state.setTimeStamp);
  const fetchStockData = useChartData((state) => state.fetchData);
  const period1 = useTimeStamp((state) => state.period1);
  const period2 = useTimeStamp((state) => state.period2);
  const label = useSidebarLabels((state) => state.label);
  const timeStamp = useTimeStamp((state) => state.timestamp);

  const buttonBg = theme === "dark" ? "bg-gray-700" : "bg-gray-300";
  const buttonHoverBg =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-400";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";

  const timestamps = ["1M", "1H", "1D", "1WK"];

  return (
    <div
      className={`w-full h-full flex justify-between items-center p-2 ${
        theme === "dark" ? "bg-gray-800" : "bg-gray-200"
      }`}
    >
      <button
        className={`ml-4 ${textColor} ${buttonBg} ${buttonHoverBg} p-2 rounded transition duration-150 ease-in-out`}
        onClick={toggleTheme}
      >
        {theme === "light" ? "Switch to Dark" : "Switch to Light"}
      </button>
      <div className="mr-4 flex space-x-2">
        {timestamps.map((timestamp) => (
          <button
            key={timestamp}
            className={`p-2 ${textColor} ${buttonBg} ${buttonHoverBg} rounded transition duration-150 ease-in-out`}
            onClick={async () => {
              await setTimeStamp(timestamp);
              fetchStockData(label, timeStamp, period1, period2);
            }}
          >
            {timestamp}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Menu;
