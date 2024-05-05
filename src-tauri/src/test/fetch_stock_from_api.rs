use reqwest::StatusCode;
use serde::Serialize;

use super::{CustomQuoteDay, StockQuote, CustomQuote};

#[derive(Serialize)]
pub enum CustomQuoteType {
    Day(CustomQuoteDay),
    IntraDay(CustomQuote),
}

#[tauri::command]
pub async fn fetch_stock_chart(symbol: String, timeframe: &str, period1: &str, period2: &str) -> Result<Vec<CustomQuoteType>, String> {
    let stock_data = fetch_stock_data(&symbol, &timeframe, &period1, &period2).await?;
    let mut custom_quotes = Vec::new();
    if timeframe == "1D" {
        custom_quotes = transform_to_custom_quotes_day(stock_data);
    } else {
        custom_quotes = transform_to_custom_quotes(stock_data);
    }
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

fn transform_to_custom_quotes_day(stock_data: Vec<StockQuote>) -> Vec<CustomQuoteType> {
    stock_data.iter().map(|quote| {
        CustomQuoteType::Day(CustomQuoteDay {
            high: quote.high,
            volume: quote.volume,
            open: quote.open,
            low: quote.low,
            close: quote.close,
            time: quote.date.date_naive(),
        })
    }).collect()
}

fn transform_to_custom_quotes(stock_data: Vec<StockQuote>) -> Vec<CustomQuoteType> {
    stock_data.iter().map(|quote| {
        CustomQuoteType::IntraDay(CustomQuote {
            high: quote.high,
            volume: quote.volume,
            open: quote.open,
            low: quote.low,
            close: quote.close,
            time: quote.date,
        })
    }).collect()
}