import React from "react";
import { useTheme } from "../contexts/ThemeContext";

const Menu: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Theme-dependent button styling
  const buttonBg = theme === "dark" ? "bg-gray-700" : "bg-gray-300";
  const buttonHoverBg =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-400";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";

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
      <div className="mr-4">
        <button
          className={`p-2 ${textColor} ${buttonBg} ${buttonHoverBg} rounded transition duration-150 ease-in-out`}
        >
          Timestamp 1
        </button>
        <button
          className={`p-2 ${textColor} ${buttonBg} ${buttonHoverBg} rounded transition duration-150 ease-in-out`}
        >
          Timestamp 2
        </button>
      </div>
    </div>
  );
};

export default Menu;
