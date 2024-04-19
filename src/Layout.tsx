import { FC, PropsWithChildren } from "react";
import Sidebar from "./components/Sidebar";
import Menu from "./components/Menu";
import { useTheme } from "./contexts/ThemeContext";

const Layout: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { theme } = useTheme();

  const sidebarItems = [
    { label: "AAPL", onClick: () => console.log("AAPL clicked") },
    { label: "GOOGL", onClick: () => console.log("GOOGL clicked") },
    { label: "MSFT", onClick: () => console.log("MSFT clicked") },
    { label: "AMZN", onClick: () => console.log("AMZN clicked") },
    { label: "TSLA", onClick: () => console.log("TSLA clicked") },
  ];

  const bgClass = theme === "dark" ? "bg-dark" : "bg-light";
  const contentBgClass =
    theme === "dark" ? "bg-content-dark" : "bg-content-light";

  return (
    <div className={`flex h-full w-full ${bgClass}`}>
      <div className="w-1/5">
        <Sidebar items={sidebarItems} />
      </div>
      <div className={`w-4/5 ${contentBgClass} h-screen`}>
        <div className="h-[15%]">
          <Menu />
        </div>
        <div className="h-[85%] overflow-auto">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
