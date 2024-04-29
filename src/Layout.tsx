import { FC, PropsWithChildren, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { useTheme } from "./contexts/ThemeContext";
import { invoke } from "@tauri-apps/api/tauri";
import ChartComponent from "./components/ChartComponent";
import ChartDataContext from "./contexts/ChartDataContext";
import { SidebarItem, StockChartDataArray } from "./types";
import Menu from "./components/Menu";

const Layout: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { theme } = useTheme();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [chartData, setChartData] = useState<StockChartDataArray>(null as any);

  useEffect(() => {
    getSidebarItems().then((items) => setSidebarItems(items));
  }, []);

  function getSidebarItems(): Promise<SidebarItem[]> {
    return invoke<string[]>("get_labels").then((labels) => {
      return labels.map((label) => ({
        label,
        onClick: () => {
          invoke("fetch_stock_chart", { symbol: label }).then(
            (data: unknown) => {
              console.log("Data from fetch_stock_chart:", data);

              if (setChartData) {
                setChartData(data as StockChartDataArray);
              }
            }
          );
        }
      }));
    });
  }

  const handleRemoveItem = (label: string) => {
    setSidebarItems((prevItems) =>
      prevItems.filter((item) => item.label !== label)
    );
  };

  const bgClass = theme === "dark" ? "bg-dark" : "bg-light";
  const contentBgClass =
    theme === "dark" ? "bg-content-dark" : "bg-content-light";
  const bgClassColor = theme === "dark" ? "bg-gray-800" : "bg-gray-200";

  return (
    <ChartDataContext.Provider value={{ chartData, setChartData }}>
      <div className={`flex h-full w-full ${bgClass} `}>
        <div className={`w-1/5 ${bgClassColor}`}>
          <Sidebar
            items={sidebarItems}
            onRemove={handleRemoveItem}
            chartData={chartData || []}
            addItem={() => {}}
          />
        </div>
        <div
          className={`w-4/5 ${contentBgClass} h-screen`}
          style={{ minHeight: "100vh" }}
        >
          <div className="h-[15%]">
            <Menu />
          </div>
          <div className="h-[85%] overflow-auto">
            {chartData && chartData.length > 0 && (
              <ChartComponent data={chartData} />
            )}
            {children}
          </div>
        </div>
      </div>
    </ChartDataContext.Provider>
  );
};
export default Layout;
