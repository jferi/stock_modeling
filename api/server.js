const { time } = require("console");
const express = require("express");
const yahooFinance = require("yahoo-finance2").default;

const app = express();
const PORT = 3000;

app.get("/stock/chart/:symbol", async (req, res) => {
  try {
    const { timeframe, period1, period2 } = req.query;
    const minDate = new Date("2000-01-01T00:00:00Z").getTime();
    const period1Date = new Date(period1).getTime();
    const adjustedPeriod1 = period1Date < minDate ? "2000-01-01" : period1;

    const queryOptions = {
      interval: timeframe.toLowerCase(),
      period1: adjustedPeriod1,
      period2: period2
    };
    const data = (await yahooFinance.chart(req.params.symbol, queryOptions))
      .quotes;
    res.json(data);
  } catch (error) {
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
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
