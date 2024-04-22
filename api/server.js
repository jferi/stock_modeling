const express = require('express');
const yahooFinance = require('yahoo-finance2').default;

const app = express();
const PORT = 3000;

app.get('/api/stock/chart/:symbol', async (req, res) => {
    try {
        const queryOptions = { period1: '2020-01-01'};
        const data = await yahooFinance.chart(req.params.symbol, queryOptions);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
