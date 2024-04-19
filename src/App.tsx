import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";
import Layout from "./Layout";
import ChartComponent from "./components/ChartComponent";

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <ChartComponent />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
