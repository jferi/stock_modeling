import { invoke } from "@tauri-apps/api/tauri";
import { useAtomValue } from "jotai";
import { FC } from "react";
import { themeAtom } from "../store/atoms";
import { useChartData } from "../store/chartdata";
import { useSidebarLabels } from "../store/sidebar";
import { useTimeStamp } from "../store/timestamp";
import { StockChartData } from "../types";
import SearchBar from "./SearchBar";

const Sidebar: FC = () => {
  const theme = useAtomValue(themeAtom);
  const labels = useSidebarLabels((state) => state.labels);
  const removeLabel = useSidebarLabels((state) => state.removeLabel);
  const setData = useChartData((state) => state.setData);
  const timeframe: string = useTimeStamp((state) => state.timestamp);
  const setLabel = useSidebarLabels((state) => state.setLabel);
  const refreshLabels = useSidebarLabels((state) => state.refreshLabels);

  const backgroundColorClass = theme === "dark" ? "bg-gray-800" : "bg-gray-200";
  const textColorClass = theme === "dark" ? "text-white" : "text-gray-800";
  const hoverBackgroundColorClass =
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300";

  const handleLabelClick = async (label: string) => {
    setLabel(label);
    const data = await invoke("get_data", {
      symbol: label,
      timeframe: timeframe
    });
    setData(data as StockChartData[]);
  };

  const handleRemoveLabel = async (e: React.MouseEvent, label: string) => {
    e.stopPropagation();
    removeLabel(label);
    refreshLabels();
  };

  return (
    <div className={`${backgroundColorClass} ${textColorClass} w-full h-full`}>
      <h1 className="text-2xl font-bold p-4 text-center">Stocks</h1>
      <div className="w-3/4 mx-auto pb-4">
        <SearchBar />
      </div>

      <ul className={`${backgroundColorClass} ${textColorClass}`}>
        {labels.map((label) => (
          <li
            key={label}
            className={`flex justify-between px-4 py-2 cursor-pointer ${hoverBackgroundColorClass} ${backgroundColorClass} ${textColorClass}`}
            onClick={() => handleLabelClick(label)}
          >
            {label}
            <span
              onClick={(e) => handleRemoveLabel(e, label)}
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
