import { useAtomValue } from "jotai/react";
import { FC, PropsWithChildren, useEffect } from "react";
import Chart from "./components/Chart";
import Menu from "./components/Menu";
import Sidebar from "./components/Sidebar";
import { themeAtom } from "./store/atoms";
import { useChartData } from "./store/chartdata";
import { useTheme } from "./store/theme";

const Layout: FC<PropsWithChildren<{}>> = ({ children }) => {
  const theme = useTheme();
  const themeStyle = useAtomValue(themeAtom);
  const setTheme = useTheme((state) => state.setTheme);
  const chartData = useChartData((state) => state.data);

  useEffect(() => {
    setTheme(themeStyle);
  }, [themeStyle, setTheme]);

  return (
    <div className={`flex h-full w-full ${theme.bgClass} `}>
      <div className={`w-1/5 ${theme.bgClassColor}`}>
        <Sidebar />
      </div>
      <div
        className={`w-4/5 ${theme.contentBgClass} h-screen`}
        style={{ minHeight: "100vh" }}
      >
        <div className="h-[15%]">
          <Menu />
        </div>
        <div className={`h-[85%] overflow-auto ${theme.bgClassColorChart}`}>
          {chartData && chartData.length > 0 && <Chart data={chartData} />}
          {children}
        </div>
      </div>
    </div>
  );
};
export default Layout;
