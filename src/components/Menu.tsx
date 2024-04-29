import React from "react";
import { useTheme } from "../contexts/ThemeContext";

const Menu: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const buttonBg = theme === "dark" ? "bg-gray-700" : "bg-gray-300";
  const buttonHoverBg =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-400";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";

  const timestamps = ["1M", "5M", "15M", "1H", "1D"];

  const timeStampChange = (time: string) => {
    console.log(time);
  }
  

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
            onClick={() => timeStampChange(timestamp)}
          >
            {timestamp}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Menu;
