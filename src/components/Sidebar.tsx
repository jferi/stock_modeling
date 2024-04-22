import React from "react";
import { useTheme } from "../contexts/ThemeContext";

interface SidebarItem {
  label: string;
  onClick: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const { theme } = useTheme();

  const backgroundColor = theme === "dark" ? "bg-gray-800" : "bg-gray-200";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const hoverBackgroundColor =
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300";

  return (
    <div
      className={`w-1/5 min-w-[15%] ${backgroundColor} ${textColor} transition duration-200 ease-in-out fixed inset-y-0 left-0`}
    >
      <ul className="space-y-2 p-2">
        {items.map((item, index) => (
          <li key={index} className="block">
            <button
              className={`text-left w-full px-3 py-2 rounded ${hoverBackgroundColor} focus:outline-none focus:${hoverBackgroundColor}`}
              onClick={item.onClick}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
