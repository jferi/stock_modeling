import { useAtomValue } from "jotai/react";
import { FC, PropsWithChildren } from "react";
import ChartComponent from "./components/ChartComponent";
import Menu from "./components/Menu";
import Sidebar from "./components/Sidebar";
import { themeAtom } from "./store/atoms";
import { useChartData } from "./store/chartdata";

const Layout: FC<PropsWithChildren<{}>> = ({ children }) => {
  const theme = useAtomValue(themeAtom);
  const chartData = useChartData((state) => state.data);

  const bgClass = theme === "dark" ? "bg-dark" : "bg-light";
  const contentBgClass =
    theme === "dark" ? "bg-content-dark" : "bg-content-light";
  const bgClassColor = theme === "dark" ? "bg-gray-800" : "bg-gray-200";
  const bgClassColorChart = theme === "dark" ? "bg-gray-600" : "bg-gray-100";

  return (
    <div className={`flex h-full w-full ${bgClass} `}>
      <div className={`w-1/5 ${bgClassColor}`}>
        <Sidebar />
      </div>
      <div
        className={`w-4/5 ${contentBgClass} h-screen`}
        style={{ minHeight: "100vh" }}
      >
        <div className="h-[15%]">
          <Menu />
        </div>
        <div className={`h-[85%] overflow-auto ${bgClassColorChart}`}>
          {chartData && chartData.length > 0 && (
            <ChartComponent data={chartData} />
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
export default Layout;
