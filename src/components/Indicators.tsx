import { useAtomValue } from "jotai";
import { FC, useEffect, useRef, useState } from "react";
import { themeAtom } from "../store/atoms";
import { useIndicatorStore } from "../store/indicators";
import { useSidebarLabels } from "../store/sidebar";
import { useTheme } from "../store/theme";
import { useTimeStamp } from "../store/timestamp";
import { predefinedIndicators } from "./utils/IndicatorUtil";

const Indicators: FC = () => {
  const currentTheme = useAtomValue(themeAtom);
  const theme = useTheme();
  const setTheme = useTheme((state) => state.setTheme);

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme, setTheme]);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addIndicatorRef = useRef<HTMLDivElement>(null);
  const addIndicator = useIndicatorStore((state) => state.addIndicator);
  const removeIndicator = useIndicatorStore((state) => state.removeIndicator);
  const activeIndicators = useIndicatorStore((state) => state.activeIndicators);
  const label = useSidebarLabels((state) => state.label);
  const timeframe = useTimeStamp((state) => state.timestamp);

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
        className={`px-4 py-2 rounded transition duration-150 ease-in-out ${theme.buttonBg} ${theme.buttonHoverBg} ${theme.textColor} border ${theme.borderColor}`}
        onClick={toggleIndicatorMenu}
      >
        Indicators
      </button>
      {isIndicatorMenuOpen && (
        <div
          ref={dropdownRef}
          className={`absolute right-0 mt-2 w-64 shadow-lg rounded-lg z-50 ${theme.dropdownBg} border ${theme.dropdownBorder}`}
        >
          <div className="p-4">
            <button
              className={`px-4 py-2 mb-4 w-full rounded transition duration-150 ease-in-out ${theme.buttonBg} ${theme.buttonHoverBg} ${theme.textColor} border ${theme.borderColor}`}
              onClick={toggleDropdown}
            >
              Add Indicator
            </button>
            {isOpen && (
              <div
                ref={addIndicatorRef}
                className={`absolute right-full top-0 mt-2 w-72 shadow-lg rounded-lg z-50 ${theme.dropdownBg} border ${theme.dropdownBorder} overflow-auto max-h-80 ${theme.scrollbarColor} scrollbar-thin`}
              >
                {!selectedType ? (
                  <div className="p-4">
                    <h2
                      className={`text-xl font-bold mb-2 ${theme.dropdownText}`}
                    >
                      Select Indicator Type
                    </h2>
                    <ul>
                      {predefinedIndicators.map((indicator) => (
                        <li
                          key={indicator.type}
                          className={`cursor-pointer py-2 px-4 ${theme.variantHoverBg} rounded ${theme.dropdownText} `}
                          onClick={() => setSelectedType(indicator.type)}
                        >
                          {indicator.type}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-4">
                    <h2
                      className={`text-xl font-bold mb-2 ${theme.dropdownText}`}
                    >
                      {selectedType} Variants
                    </h2>
                    <ul>
                      {predefinedIndicators
                        .find((indicator) => indicator.type === selectedType)
                        ?.variants.map((variant) => (
                          <li
                            key={variant}
                            className={`cursor-pointer py-2 px-4 ${theme.variantHoverBg} rounded ${theme.dropdownText}`}
                            onClick={() => {
                              addIndicator(label, timeframe, variant);
                            }}
                          >
                            {variant}
                          </li>
                        ))}
                    </ul>
                    <button
                      className={`mt-4 px-4 py-2 rounded transition duration-150 ease-in-out ${theme.buttonBg} ${theme.buttonHoverBg} ${theme.textColor} border ${theme.borderColor}`}
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
            <h2 className={`text-xl font-bold mb-2 ${theme.dropdownText}`}>
              Active Indicators
            </h2>
            <ul>
              {Array.from(activeIndicators.keys()).map((key) => (
                <li
                  key={key as React.Key}
                  className={`flex justify-between items-center py-2 px-4 rounded ${theme.dropdownText}`}
                >
                  <span>{key}</span>
                  <button
                    className={`ml-4 px-2 py-1 rounded transition duration-150 ease-in-out ${theme.buttonBg} ${theme.buttonHoverBg} ${theme.textColor} border ${theme.borderColor}`}
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
