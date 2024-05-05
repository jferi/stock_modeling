import { invoke } from "@tauri-apps/api/tauri";
import React, { useEffect, useState } from "react";
import { useToggle } from "react-use";
import { useTheme } from "../contexts/ThemeContext";
import { useSidebarLabels } from "../store/sidebar";
import useOutsideClick from "./outsideClick";

const SearchBar: React.FC = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [toggle, setToggle] = useToggle(false);
  const dropdownRef = React.useRef(null);
  const setLabel = useSidebarLabels((state) => state.setLabel);

  useOutsideClick(dropdownRef, () => {
    setToggle(false);
  });

  useEffect(() => {
    const searchStocks = async () => {
      if (searchTerm.length > 1) {
        try {
          const results = await invoke<string[]>("search_indices", {
            query: searchTerm
          });
          setSearchResults(results);
          setToggle();
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
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleItemClick = async (label: string) => {
    try {
      await invoke("add_item", { item: label });
      setLabel(label);
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
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
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
