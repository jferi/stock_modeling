const { time } = require("console");
const express = require("express");
const yahooFinance = require("yahoo-finance2").default;

const app = express();
const PORT = 3000;

app.get("/stock/chart/:symbol", async (req, res) => {
  try {
    const { timeframe, period1, period2 } = req.query;
    const queryOptions = {
      interval: timeframe.toLowerCase(),
      period2: period2,
      period1: period1
    };
    const data = (await yahooFinance.chart(req.params.symbol, queryOptions))
      .quotes;
    res.json(data);
  } catch (error) {
    console.log("Error fetching data:", error);
    res.status(500).json({ error: error.toString() });
  }
});

app.get("/search-stocks/:symbol", async (req, res) => {
  const query = req.params.symbol;

  try {
    const results = await yahooFinance.search(query, {
      lang: "en-US",
      region: "US"
    });
    const symbols = results.quotes
      .map((quote) => quote.symbol)
      .filter((symbol) => symbol !== null)
      .filter((symbol) => symbol !== undefined);

    res.json(symbols);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
