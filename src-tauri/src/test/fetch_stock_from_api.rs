use reqwest::StatusCode;

use super::{StockQuote, CustomQuote};

#[tauri::command]
pub async fn fetch_stock_chart(symbol: String, timeframe: &str, period1: &str, period2: &str) -> Result<Vec<CustomQuote>, String> {
    let stock_data = fetch_stock_data(&symbol, &timeframe, &period1, &period2).await?;
    let complete_data = filter_complete_quotes(stock_data);
    let custom_quotes = transform_to_custom_quotes(complete_data);
    Ok(custom_quotes)
}

async fn fetch_stock_data(symbol: &str, timeframe: &str, period1: &str, period2: &str) -> Result<Vec<StockQuote>, String> {
    let client = reqwest::Client::new();
    let url = format!("http://localhost:3000/stock/chart/{}?timeframe={}&period1={}&period2={}", symbol, timeframe, period1, period2);  
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    match response.status() {
        StatusCode::OK => {
            let stock_data: Vec<StockQuote> = response.json().await.map_err(|e| e.to_string())?;
            Ok(stock_data)
        },
        status => {
            println!("Failed to fetch stock data: HTTP {}", status);
            Err(format!("Failed to fetch stock data: HTTP {}", status))}
    }
}

fn transform_to_custom_quotes(stock_data: Vec<StockQuote>) -> Vec<CustomQuote> {
    let mut custom_quotes: Vec<CustomQuote> = Vec::new();

    for (index, quote) in stock_data.iter().enumerate() {
        let open = if index == 0 {
            quote.open 
        } else {
            stock_data[index - 1].close
        };

        let custom_quote = CustomQuote {
            high: quote.high,
            volume: quote.volume,
            open: open, 
            low: quote.low,
            close: quote.close,
            time: quote.date,
        };

        custom_quotes.push(custom_quote);
    }

    custom_quotes
}

fn filter_complete_quotes(stock_data: Vec<StockQuote>) -> Vec<StockQuote> {
    stock_data.into_iter()
        .filter(|quote| {
            quote.high.is_some() && quote.low.is_some() && quote.open.is_some() && quote.close.is_some()
        })
        .collect()
}
