import { useAtomValue } from "jotai";
import { FC, useEffect, useRef, useState } from "react";
import { themeAtom } from "../store/atoms";
import { useIndicatorStore } from "../store/indicators";
import { useSidebarLabels } from "../store/sidebar";
import { useTimeStamp } from "../store/timestamp";

type PredefinedIndicator = {
  type: string;
  variants: string[];
};

const predefinedIndicators: PredefinedIndicator[] = [
  {
    type: "SMA",
    variants: [
      "SMA 5",
      "SMA 8",
      "SMA 13",
      "SMA 21",
      "SMA 50",
      "SMA 100",
      "SMA 200"
    ]
  },
  {
    type: "EMA",
    variants: [
      "EMA 5",
      "EMA 8",
      "EMA 13",
      "EMA 21",
      "EMA 50",
      "EMA 100",
      "EMA 200"
    ]
  },
  { type: "RSI", variants: ["RSI 7", "RSI 14", "RSI 21"] },
  { type: "MACD", variants: ["MACD 12 26 9"] },
  { type: "VOLUME", variants: ["VOLUME"] }
];

const Indicators: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] = useState(false);
  const theme = useAtomValue(themeAtom);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addIndicatorRef = useRef<HTMLDivElement>(null);
  const addIndicator = useIndicatorStore((state) => state.addIndicator);
  const removeIndicator = useIndicatorStore((state) => state.removeIndicator);
  const activeIndicators = useIndicatorStore((state) => state.activeIndicators);
  const label = useSidebarLabels((state) => state.label);
  const timeframe = useTimeStamp((state) => state.timestamp);

  const buttonBg = theme === "dark" ? "bg-gray-700" : "bg-gray-300";
  const buttonHoverBg =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-400";
  const variantHoverBg =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-300";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300";
  const dropdownBg = theme === "dark" ? "bg-gray-800" : "bg-white";
  const dropdownText = theme === "dark" ? "text-white" : "text-gray-800";
  const dropdownBorder =
    theme === "dark" ? "border-gray-700" : "border-gray-300";
  const scrollbarColor =
    theme === "dark"
      ? "scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      : "scrollbar-thumb-gray-400 scrollbar-track-gray-200";

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setSelectedType(null);
  };

  const toggleIndicatorMenu = () => {
    setIsIndicatorMenuOpen(!isIndicatorMenuOpen);
    if (isOpen) {
      setIsOpen(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      addIndicatorRef.current &&
      !addIndicatorRef.current.contains(event.target as Node)
    ) {
      setIsIndicatorMenuOpen(false);
      setIsOpen(false);
    } else if (
      dropdownRef.current &&
      dropdownRef.current.contains(event.target as Node) &&
      isOpen &&
      !addIndicatorRef.current?.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <button
        className={`px-4 py-2 rounded transition duration-150 ease-in-out ${buttonBg} ${buttonHoverBg} ${textColor} border ${borderColor}`}
        onClick={toggleIndicatorMenu}
      >
        Indicators
      </button>
      {isIndicatorMenuOpen && (
        <div
          ref={dropdownRef}
          className={`absolute right-0 mt-2 w-64 shadow-lg rounded-lg z-50 ${dropdownBg} border ${dropdownBorder}`}
        >
          <div className="p-4">
            <button
              className={`px-4 py-2 mb-4 w-full rounded transition duration-150 ease-in-out ${buttonBg} ${buttonHoverBg} ${textColor} border ${borderColor}`}
              onClick={toggleDropdown}
            >
              Add Indicator
            </button>
            {isOpen && (
              <div
                ref={addIndicatorRef}
                className={`absolute right-full top-0 mt-2 w-72 shadow-lg rounded-lg z-50 ${dropdownBg} border ${dropdownBorder} overflow-auto max-h-80 ${scrollbarColor} scrollbar-thin`}
              >
                {!selectedType ? (
                  <div className="p-4">
                    <h2 className={`text-xl font-bold mb-2 ${dropdownText}`}>
                      Select Indicator Type
                    </h2>
                    <ul>
                      {predefinedIndicators.map((indicator) => (
                        <li
                          key={indicator.type}
                          className={`cursor-pointer py-2 px-4 ${variantHoverBg} rounded ${dropdownText} `}
                          onClick={() => setSelectedType(indicator.type)}
                        >
                          {indicator.type}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-4">
                    <h2 className={`text-xl font-bold mb-2 ${dropdownText}`}>
                      {selectedType} Variants
                    </h2>
                    <ul>
                      {predefinedIndicators
                        .find((indicator) => indicator.type === selectedType)
                        ?.variants.map((variant) => (
                          <li
                            key={variant}
                            className={`cursor-pointer py-2 px-4 ${variantHoverBg} rounded ${dropdownText}`}
                            onClick={() => {
                              addIndicator(label, timeframe, variant);
                            }}
                          >
                            {variant}
                          </li>
                        ))}
                    </ul>
                    <button
                      className={`mt-4 px-4 py-2 rounded transition duration-150 ease-in-out ${buttonBg} ${buttonHoverBg} ${textColor} border ${borderColor}`}
                      onClick={() => setSelectedType(null)}
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-4">
            <h2 className={`text-xl font-bold mb-2 ${dropdownText}`}>
              Active Indicators
            </h2>
            <ul>
              {Array.from(activeIndicators.keys()).map((key) => (
                <li
                  key={key as React.Key}
                  className={`flex justify-between items-center py-2 px-4 rounded ${dropdownText}`}
                >
                  <span>{key}</span>
                  <button
                    className={`ml-4 px-2 py-1 rounded transition duration-150 ease-in-out ${buttonBg} ${buttonHoverBg} ${textColor} border ${borderColor}`}
                    onClick={() => {
                      removeIndicator(key);
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Indicators;
