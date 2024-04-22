import { FC, PropsWithChildren, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Menu from "./components/Menu";
import { useTheme } from "./contexts/ThemeContext";
import { invoke } from '@tauri-apps/api/tauri';
import ChartComponent from "./components/ChartComponent";

interface SidebarItem {
  label: string;
  onClick: () => void;
}

interface StockChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}
type StockChartDataArray = StockChartData[];

const Layout: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { theme } = useTheme();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
      getSidebarItems().then(items => setSidebarItems(items));
  }, []);

  function getSidebarItems(): Promise<SidebarItem[]> {
    return invoke<string[]>('get_labels').then(labels => {
        return labels.map(label => ({
            label,
            onClick: () => {
                invoke('fetch_stock_chart', { symbol: label })
                    .then((data: unknown) => {
                        setChartData(data as StockChartDataArray);
                    })
                    .catch(error => {
                        console.error(`Failed to fetch data for ${label}:`, error);
                    });
            },
        }));
    });
}


  const bgClass = theme === "dark" ? "bg-dark" : "bg-light";
  const contentBgClass = theme === "dark" ? "bg-content-dark" : "bg-content-light";

  return (
    <div className={`flex h-full w-full ${bgClass}`}>
      <div className="w-1/5">
        <Sidebar items={sidebarItems} />
      </div>
      <div className={`w-4/5 ${contentBgClass} h-screen`}>
        <div className="h-[15%]">
          <Menu />
        </div>
        <div className="h-[85%] overflow-auto">
          {chartData.length > 0 && <ChartComponent data={chartData} />}
          {children}
        </div>
      </div>
    </div>
  );
};



export default Layout;