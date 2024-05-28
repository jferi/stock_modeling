import { invoke } from "@tauri-apps/api/tauri";
import { useAtomValue } from "jotai/react";
import React, { useEffect } from "react";
import { useToggle } from "react-use";
import { themeAtom } from "../store/atoms";
import { useChartData } from "../store/chartdata";
import { useSidebarLabels } from "../store/labels";
import { useSearchState } from "../store/search";
import { useTimeStamp } from "../store/timestamp";
import { StockChartData } from "../types";
import useOutsideClick from "./utils/OutsideClick";

const SearchBar: React.FC = () => {
  const theme = useAtomValue(themeAtom);
  const [toggle, setToggle] = useToggle(false);
  const dropdownRef = React.useRef(null);
  const setLabel = useSidebarLabels((state) => state.setLabel);
  const searchLabel = useSearchState((state) => state.searchLabel);
  const setSearchLabel = useSearchState((state) => state.setSearchLabel);
  const searchResults = useSearchState((state) => state.searchResults);
  const setSearchResults = useSearchState((state) => state.setSearchResults);
  const timeframe = useTimeStamp((state) => state.timestamp);
  const setData = useChartData((state) => state.setData);

  useOutsideClick(dropdownRef, () => {
    setToggle(false);
  });

  useEffect(() => {
    const searchStocks = async () => {
      if (searchLabel.length > 1) {
        try {
          const results = await invoke<string[]>("search_indices", {
            query: searchLabel
          });
          if (toggle === false) setToggle(true);
          setSearchResults(results);
        } catch (error) {
          setSearchResults([]);
          setToggle();
        }
      } else {
        setSearchResults([]);
        setToggle();
      }
    };

    const timeoutId = setTimeout(() => {
      searchStocks();
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [searchLabel]);

  const handleItemClick = async (label: string) => {
    try {
      await invoke("add_item", { item: label });
      setLabel(label);
      const data = await invoke("get_data", {
        symbol: label,
        timeframe: timeframe
      });
      setData(data as StockChartData[]);
    } catch (error) {
      console.error("Error invoking Tauri command:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        className={`input border border-gray-300 rounded-md p-2 w-full ${
          theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-  "
        }`}
        placeholder="Search..."
        value={searchLabel}
        onChange={(e) => setSearchLabel(e.target.value)}
      />
      {toggle && searchResults.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 rounded-md overflow-hidden shadow-lg bg-gray-200">
          {searchResults.map((item, index) => (
            <li
              key={index}
              className={`dropdown-item p-2 hover:${
                theme === "dark"
                  ? "text-gray-100 bg-gray-600"
                  : "bg-gray-300 text-gray-800"
              } cursor-pointer`}
              onClick={() => handleItemClick(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
