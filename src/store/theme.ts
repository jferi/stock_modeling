import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type ThemeState = {
  buttonBg: string;
  buttonHoverBg: string;
  variantHoverBg: string;
  textColor: string;
  borderColor: string;
  dropdownBg: string;
  dropdownText: string;
  dropdownBorder: string;
  scrollbarColor: string;
  selectedHoverBackgroundColorClass: string;
  invalidBorderColor: string;
  invalidTextColor: string;
  animationColor: string;
  backgroundColorClassSidebar: string;
  textColorClassSidebar: string;
  hoverBackgroundColorClassSidebar: string;
  selectedHoverBackgroundColorSidebar: string;
  activeBackgroundClassSidebar: string;
  bgClass: string;
  contentBgClass: string;
  bgClassColor: string;
  bgClassColorChart: string;
  setTheme: (theme: string) => void;
};

const getThemeStyles = (theme: string) => ({
  buttonBg: theme === "dark" ? "bg-gray-700" : "bg-gray-300",
  buttonHoverBg: theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-400",
  variantHoverBg: theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-300",
  textColor: theme === "dark" ? "text-white" : "text-gray-800",
  borderColor: theme === "dark" ? "border-gray-600" : "border-gray-300",
  dropdownBg: theme === "dark" ? "bg-gray-800" : "bg-white",
  dropdownText: theme === "dark" ? "text-white" : "text-gray-800",
  dropdownBorder: theme === "dark" ? "border-gray-700" : "border-gray-300",
  scrollbarColor:
    theme === "dark"
      ? "scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      : "scrollbar-thumb-gray-400 scrollbar-track-gray-200",
  selectedHoverBackgroundColorClass:
    theme === "dark"
      ? "hover:bg-red-400 text-gray-800"
      : "hover:bg-red-200 text-gray-900",
  invalidBorderColor: "border-red-600",
  invalidTextColor: "text-red-600",
  animationColor:
    theme === "dark"
      ? "bg-red-500 hover:bg-red-500"
      : "bg-red-300 hover:bg-red-300",
  backgroundColorClassSidebar: theme === "dark" ? "bg-gray-800" : "bg-gray-200",
  textColorClassSidebar: theme === "dark" ? "text-white" : "text-gray-800",
  hoverBackgroundColorClassSidebar:
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300",
  selectedHoverBackgroundColorSidebar:
    theme === "dark"
      ? "hover:bg-red-400 hover:text-white text-gray-100"
      : "hover:bg-red-200 hover:text-gray-900",
  activeBackgroundClassSidebar:
    theme === "dark" ? "bg-red-500" : "bg-red-300 text-gray-900",
  bgClass: theme === "dark" ? "bg-dark" : "bg-light",
  contentBgClass: theme === "dark" ? "bg-content-dark" : "bg-content-light",
  bgClassColor: theme === "dark" ? "bg-gray-800" : "bg-gray-200",
  bgClassColorChart: theme === "dark" ? "bg-gray-600" : "bg-gray-100"
});

const useTheme = create<ThemeState>()(
  immer((set) => ({
    ...getThemeStyles("dark"),
    setTheme: (theme: string) =>
      set((state) => {
        const styles = getThemeStyles(theme);
        Object.assign(state, styles);
      })
  }))
);

export { useTheme };
