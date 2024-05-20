import { invoke } from "@tauri-apps/api/tauri";
import { useAtom } from "jotai/react";
import { FC } from "react";
import { themeAtom } from "../store/atoms";
import { useChartData } from "../store/chartdata";
import { useSidebarLabels } from "../store/sidebar";
import { useTimeStamp } from "../store/timestamp";
import { StockChartData, TIMESTAMPS } from "../types";

const Menu: FC = () => {
  const [theme, setTheme] = useAtom(themeAtom);
  const setTimeStamp = useTimeStamp((state) => state.setTimeStamp);
  const setData = useChartData((state) => state.setData);
  const label = useSidebarLabels((state) => state.label);
  const timeframe = useTimeStamp((state) => state.timestamp);

  const buttonBg = theme === "dark" ? "bg-gray-700" : "bg-gray-300";
  const buttonHoverBg =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-400";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";

  const getButtonClasses = (timestamp: string) => {
    const isActive = timestamp === timeframe;
    const bgColor = theme === "dark" ? "bg-red-500" : "bg-red-300";
    return `p-2 ${textColor} ${buttonBg} ${buttonHoverBg} rounded transition duration-150 ease-in-out ${
      isActive ? bgColor : ""
    }`;
  };

  return (
    <div
      className={`w-full h-full flex justify-between items-center p-2 ${
        theme === "dark" ? "bg-gray-800" : "bg-gray-200"
      }`}
    >
      <button
        className={`ml-4 ${textColor} ${buttonBg} ${buttonHoverBg} p-2 rounded transition duration-150 ease-in-out`}
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? "Switch to Dark" : "Switch to Light"}
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
    </div>
  );
};

export default Menu;
