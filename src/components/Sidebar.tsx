import { invoke } from "@tauri-apps/api/tauri";
import { FC } from "react";
import { useChartData } from "../store/chartdata";
import { useSidebarLabels } from "../store/labels";
import { useTheme } from "../store/theme";
import { useTimeStamp } from "../store/timestamp";
import { StockChartData } from "../types";
import SearchBar from "./SearchBar";

const Sidebar: FC = () => {
  const theme = useTheme();
  const labels = useSidebarLabels((state) => state.labels);
  const removeLabel = useSidebarLabels((state) => state.removeLabel);
  const setData = useChartData((state) => state.setData);
  const timeframe: string = useTimeStamp((state) => state.timestamp);
  const setLabel = useSidebarLabels((state) => state.setLabel);
  const refreshLabels = useSidebarLabels((state) => state.refreshLabels);
  const current_label = useSidebarLabels((state) => state.label);

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
    <div
      className={`${theme.backgroundColorClassSidebar} ${theme.textColorClassSidebar} w-full h-full`}
    >
      <h1 className="text-2xl font-bold p-4 text-center">Stocks</h1>
      <div className="w-3/4 mx-auto pb-4">
        <SearchBar />
      </div>

      <ul
        className={`${theme.backgroundColorClassSidebar} ${theme.textColorClassSidebar}`}
      >
        {labels.map((label) => (
          <li
            key={label}
            className={`flex justify-between px-4 py-2 cursor-pointer ${
              theme.hoverBackgroundColorClassSidebar
            } ${theme.backgroundColorClassSidebar} ${
              theme.textColorClassSidebar
            } ${
              current_label === label
                ? `${theme.activeBackgroundClassSidebar} ${theme.selectedHoverBackgroundColorSidebar}`
                : ""
            }`}
            onClick={() => handleLabelClick(label)}
          >
            {label}
            <span
              onClick={(e) => handleRemoveLabel(e, label)}
              className={`text-red-500 cursor-pointer ${
                current_label === label
                  ? `${theme.textColorClassSidebar} ${theme.selectedHoverBackgroundColorSidebar}`
                  : ""
              }`}
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
