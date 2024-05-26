
use crate::types::{CustomQuote, StockQuote};
use crate::STOCK_DATA;
use chrono::{DateTime, TimeZone, Utc};
use once_cell::sync::Lazy;
use reqwest::StatusCode;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock};

pub static MIN_DATE: Lazy<DateTime<Utc>> =
    Lazy::new(|| Utc.with_ymd_and_hms(2000, 1, 1, 0, 0, 0).unwrap());
pub static FETCH_FAILED: Lazy<RwLock<HashSet<(String, String)>>> =
    Lazy::new(|| RwLock::new(HashSet::new()));
pub static ONGOING_REQUESTS: Lazy<RwLock<HashMap<(String, String), Arc<tokio::sync::RwLock<()>>>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));


pub async fn fetch_stock_data(symbol: &str, timeframe: &str) -> Result<Vec<StockQuote>, String> {
    let (from, to) = {
        let data_map = STOCK_DATA
            .read()
            .map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
        let stock_model = data_map.get("stocks").ok_or("Stock data not found")?;
        let stock_data = stock_model
            .stock_datas
            .get(symbol)
            .and_then(|tf_map| tf_map.get(timeframe))
            .ok_or("Stock data not found for the given key")?;
        (stock_data.from, stock_data.to)
    };

    let client = reqwest::Client::new();
    let url = format!(
        "http://localhost:3000/stock/chart/{}?timeframe={}&period1={}&period2={}",
        symbol, timeframe, from, to
    );

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    match response.status() {
        StatusCode::OK => {
            let stock_data: Vec<StockQuote> = response.json().await.map_err(|e| e.to_string())?;
            Ok(stock_data)
        }
        status => {
            Err(format!("Failed to fetch stock data: HTTP {}", status))
        }
    }
}

pub async fn fetch_stock_data_for_backtest(
    symbol: &str,
    timeframe: &str,
    from: &str,
    to: &str
) -> Result<Vec<StockQuote>, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "http://localhost:3000/stock/chart/{}?timeframe={}&period1={}&period2={}",
        symbol, timeframe, from, to
    );

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    match response.status() {
        StatusCode::OK => {
            let stock_data: Vec<StockQuote> = response.json().await.map_err(|e| e.to_string())?;
            Ok(stock_data)
        }
        status => {
            Err(format!("Failed to fetch stock data: HTTP {}", status))
        }
    }

}

pub fn transform_to_custom_quotes(stock_data: Vec<StockQuote>) -> Vec<CustomQuote> {
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

    custom_quotes.sort_by_key(|quote| quote.time);

    custom_quotes
}

pub fn filter_complete_quotes(stock_data: Vec<StockQuote>) -> Vec<StockQuote> {
    let mut complete_data: Vec<StockQuote> = stock_data
        .into_iter()
        .filter(|quote| {
            quote.high.is_some()
                && quote.low.is_some()
                && quote.open.is_some()
                && quote.close.is_some()
        })
        .collect();

    complete_data.sort_by_key(|quote| quote.date);

    complete_data
}
