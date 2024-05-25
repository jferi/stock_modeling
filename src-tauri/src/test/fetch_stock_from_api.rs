use super::{CustomQuote, StockQuote};
use crate::STOCK_DATA;
use chrono::{DateTime, Duration, TimeZone, Utc};
use once_cell::sync::Lazy;
use reqwest::StatusCode;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock};
use tokio::time::{timeout, Duration as TokioDuration};

static MIN_DATE: Lazy<DateTime<Utc>> =
    Lazy::new(|| Utc.with_ymd_and_hms(2000, 1, 1, 0, 0, 0).unwrap());
static FETCH_FAILED: Lazy<RwLock<HashSet<(String, String)>>> =
    Lazy::new(|| RwLock::new(HashSet::new()));
static ONGOING_REQUESTS: Lazy<RwLock<HashMap<(String, String), Arc<tokio::sync::RwLock<()>>>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

#[tauri::command]
pub async fn fetch_stock_chart(symbol: &str, timeframe: &str) -> Result<Vec<CustomQuote>, String> {
    let key = (symbol.to_string(), timeframe.to_string());

    let request_lock = {
        let mut ongoing_requests = ONGOING_REQUESTS.write().unwrap();
        ongoing_requests
            .entry(key.clone())
            .or_insert_with(|| Arc::new(tokio::sync::RwLock::new(())))
            .clone()
    };

    let _guard = request_lock.write().await;

    let fetch_result = timeout(
        TokioDuration::from_millis(3000),
        fetch_stock_data(symbol, timeframe),
    )
    .await;

    let stock_data: Vec<StockQuote> = match fetch_result {
        Ok(Ok(data)) => data,
        Ok(Err(e)) => return Err(e),
        Err(_) => {
            let mut failed_fetches = FETCH_FAILED.write().unwrap();
            failed_fetches.insert(key.clone());
            return Err("Request timed out".to_string());
        }
    };

    if stock_data.len() < 5 {
        let mut failed_fetches = FETCH_FAILED.write().unwrap();
        failed_fetches.insert(key.clone());
        return Err("Insufficient data fetched from backend".to_string());
    }

    let complete_data = filter_complete_quotes(stock_data);
    let mut custom_quotes = transform_to_custom_quotes(complete_data);

    let (from, _to) = {
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

    {
        let mut data_map = STOCK_DATA
            .write()
            .map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
        let stock_model = data_map.get_mut("stocks").ok_or("Stock data not found")?;
        let existing_quotes = stock_model
            .get_data(&symbol, &timeframe)
            .unwrap_or(&Vec::new())
            .clone();

        let new_quotes: Vec<CustomQuote> = custom_quotes
            .into_iter()
            .filter(|new_quote| {
                !existing_quotes
                    .iter()
                    .any(|existing_quote| *existing_quote == *new_quote)
            })
            .collect();

        stock_model.append_data(&symbol, &timeframe, new_quotes.clone());

        let new_from = match timeframe {
            "1M" => from - Duration::days(5),
            "1H" => from - Duration::weeks(30),
            "1D" => from - Duration::days(8 * 365),
            "1WK" => from - Duration::days(15 * 365),
            _ => return Err("Invalid timeframe".to_string()),
        };

        let new_from = if new_from < *MIN_DATE {
            *MIN_DATE
        } else {
            new_from
        };

        let from = new_quotes
            .iter()
            .map(|quote| quote.time)
            .min()
            .unwrap_or(from);
        let from = if from < *MIN_DATE {
            *MIN_DATE
        } else {
            from - Duration::days(1)
        };

        stock_model.update_period(&symbol, &timeframe, new_from, from);
        custom_quotes = stock_model.get_data(&symbol, &timeframe).unwrap().clone();

        let mut times_seen = HashMap::new();
        let mut duplicates = Vec::new();
        for quote in &custom_quotes {
            let count = times_seen.entry(quote.time).or_insert(0);
            *count += 1;
            if *count == 2 {
                duplicates.push(quote.time);
            }
        }

        if !duplicates.is_empty() {
            for time in duplicates {
                custom_quotes.retain(|quote| quote.time != time);
                stock_model.remove_data(&symbol, &timeframe, time);
            }
        } 
    }

    Ok(custom_quotes)
}

async fn fetch_stock_data(symbol: &str, timeframe: &str) -> Result<Vec<StockQuote>, String> {
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
