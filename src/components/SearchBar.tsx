import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { SidebarItem } from "../types";
import { invoke } from "@tauri-apps/api/tauri";
import useOutsideClick from "./outsideClick";

interface SearchBarProps {
  addItem: (label: SidebarItem) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ addItem }) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = React.useRef(null);

  useOutsideClick(dropdownRef, () => {
    setShowDropdown(false);
  });

  useEffect(() => {
    const searchStocks = async () => {
      if (searchTerm.length > 1) {
        try {
          const results: string[] = await invoke("search_indices", {
            query: searchTerm
          });
          setSearchResults(results);
          setShowDropdown(true);
        } catch (error) {
          setSearchResults([]);
          setShowDropdown(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    };

    console.log("Searching for:", searchTerm);
    const timeoutId = setTimeout(() => {
      searchStocks();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleItemClick = async (label: string) => {
    try {
      await invoke("add_item", { item: label });
      addItem({ label } as SidebarItem);
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
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
      />
      {showDropdown && searchResults.length > 0 && (
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
