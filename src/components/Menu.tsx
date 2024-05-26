import { invoke } from "@tauri-apps/api/tauri";
import { useAtom } from "jotai/react";
import { FC } from "react";
import { themeAtom } from "../store/atoms";
import { useChartData } from "../store/chartdata";
import { useSidebarLabels } from "../store/sidebar";
import { useTheme } from "../store/theme";
import { useTimeStamp } from "../store/timestamp";
import { StockChartData, TIMESTAMPS } from "../types";
import Backtest from "./Backtest";
import Indicators from "./Indicators";

const Menu: FC = () => {
  const theme = useTheme();
  const [themeStyle, setTheme] = useAtom(themeAtom);
  const setTimeStamp = useTimeStamp((state) => state.setTimeStamp);
  const setData = useChartData((state) => state.setData);
  const label = useSidebarLabels((state) => state.label);
  const timeframe = useTimeStamp((state) => state.timestamp);

  const getButtonClasses = (timestamp: string) => {
    const isActive = timestamp === timeframe;
    const bgColor = themeStyle === "dark" ? "bg-red-500" : "bg-red-300";
    return `p-2 ${theme.textColor} ${theme.buttonBg} ${
      theme.buttonHoverBg
    } rounded transition duration-150 ease-in-out ${
      isActive ? `${bgColor} ${theme.selectedHoverBackgroundColorClass}` : ""
    }`;
  };

  return (
    <div
      className={`w-full h-full flex justify-between items-center p-2 ${
        themeStyle === "dark" ? "bg-gray-800" : "bg-gray-200"
      }`}
    >
      <button
        className={`px-4 py-2 rounded transition duration-150 ease-in-out ${theme.textColor} ${theme.buttonBg} ${theme.buttonHoverBg}`}
        onClick={() => setTheme(themeStyle === "light" ? "dark" : "light")}
      >
        {themeStyle === "light" ? "Switch to Dark" : "Switch to Light"}
      </button>

      <div className="mr-4 flex space-x-2">
        {TIMESTAMPS.map((timestamp) => (
          <button
            key={timestamp}
            className={getButtonClasses(timestamp)}
            onClick={async () => {
              setTimeStamp(timestamp);
              const data = await invoke("get_data", {
                symbol: label,
                timeframe: timestamp
              });
              setData(data as StockChartData[]);
            }}
          >
            {timestamp}
          </button>
        ))}
      </div>
      <Backtest />

      <Indicators />
    </div>
  );
};

export default Menu;
