import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";
import Layout from "./Layout";

function App() {
  return (
    <ThemeProvider>
      <Layout />
    </ThemeProvider>
  );
}

export default App;
