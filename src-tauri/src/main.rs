#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod utils;
pub mod types;
pub mod models;
use chrono::Duration;
use lazy_static::lazy_static;
use tokio::time::timeout;
use utils::backtest_utils::calculate_performance;
use std::time::Duration as TokioDuration;
use utils::fetch_stock_utils::{fetch_stock_data, fetch_stock_data_for_backtest, filter_complete_quotes, transform_to_custom_quotes, FETCH_FAILED, MIN_DATE, ONGOING_REQUESTS};
use utils::indicator_utils::{calculate_ema, calculate_macd, calculate_rsi, calculate_sma, calculate_volume};
use utils::init_data_utils::{fetch_initial_data, initialize_data};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, Manager};
use types::{ CustomQuote, DateRange, IndicatorData, StockQuote, StrategyResult};
use crate::models::stock_model::StockModel;

lazy_static! {
    static ref STOCK_DATA: Arc<RwLock<HashMap<String, StockModel>>> = {
        let mut data = HashMap::new();
        let mut stock_model = StockModel::new();
        stock_model.initialize_timeframes("AAPL");
        stock_model.initialize_timeframes("AMZN");
        stock_model.initialize_timeframes("GOOGL");
        data.insert("stocks".to_string(), stock_model);
        Arc::new(RwLock::new(data))
    };
}

#[tauri::command]
async fn get_indicators(
    symbol: &str,
    timeframe: &str,
    variant: &str,
    lengths: Vec<usize>, 
) -> Result<Vec<Vec<IndicatorData>>, String> {
    let new_symbol = symbol.to_string();
    let new_timeframe = timeframe.to_string();
    let chart_data: Vec<CustomQuote> = get_data(new_symbol.clone(), new_timeframe.clone())
        .await?
        .into_iter()
        .collect();

    match variant {
        "SMA" => {
            if lengths.len() == 1 {
                Ok(vec![calculate_sma(&chart_data, lengths[0])])
            } else {
                Err("SMA requires exactly one length".to_string())
            }
        },
        "EMA" => {
            if lengths.len() == 1 {
                Ok(vec![calculate_ema(&chart_data, lengths[0])])
            } else {
                Err("EMA requires exactly one length".to_string())
            }
        },
        "RSI" => {
            if lengths.len() == 1 {
                Ok(vec![calculate_rsi(&chart_data, lengths[0])])
            } else {
                Err("RSI requires exactly one length".to_string())
            }
        },
        "MACD" => {
            if lengths.len() == 3 {
                let (macd_line, signal_line, macd_histogram) = calculate_macd(
                    &chart_data,
                    lengths[0],
                    lengths[1],
                    lengths[2],
                );
                Ok(vec![macd_line, signal_line, macd_histogram])
            } else {
                Err("MACD requires exactly three lengths".to_string())
            }
        },
        "VOLUME" => {
            Ok(vec![calculate_volume(&chart_data)])
        },
        _ => Err("Invalid indicator variant".to_string()),
    }
}


#[tauri::command]
async fn fetch_stock_chart(symbol: &str, timeframe: &str) -> Result<Vec<CustomQuote>, String> {
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

#[tauri::command]
async fn alligator_strategy(symbol: &str, timeframe: &str, from: &str, to:&str, period1: usize, period2: usize, period3: usize) -> Result<StrategyResult, String> {
    let data = fetch_stock_data_for_backtest(symbol, timeframe, from, to).await.unwrap();
    let filtered_data = filter_complete_quotes(data);
    let custom_quotes = transform_to_custom_quotes(filtered_data);
    let sma1 = calculate_sma(&custom_quotes, period1);
    let sma2 = calculate_sma(&custom_quotes, period2);
    let sma3 = calculate_sma(&custom_quotes, period3);

    let mut signals = vec!["hold".to_string(); custom_quotes.len()];
    for i in 1..custom_quotes.len() {
        if sma1[i].value > sma2[i].value && sma2[i].value > sma3[i].value {
            signals[i] = "buy".to_string();
        } else if sma1[i].value < sma2[i].value && sma2[i].value < sma3[i].value {
            signals[i] = "sell".to_string();
        }
    }

    Ok(calculate_performance(&custom_quotes, &signals))
}

#[tauri::command]
async fn macd_strategy(symbol: &str, timeframe: &str, from: &str, to:&str, macd_short: usize, macd_long: usize, macd_signal: usize) -> Result<StrategyResult, String> {
    let data = fetch_stock_data_for_backtest(symbol, timeframe, from, to).await.unwrap();
    let filtered_data = filter_complete_quotes(data);
    let custom_quotes = transform_to_custom_quotes(filtered_data);
    let (macd_line, signal_line, _) = calculate_macd(&custom_quotes, macd_short, macd_long, macd_signal);

    let mut signals = vec!["hold".to_string(); custom_quotes.len()];
    for i in 0..custom_quotes.len() {
        if i < macd_short || i < macd_long || i < macd_signal {
            continue;
        }
        if macd_line[i].value > signal_line[i].value {
            signals[i] = "buy".to_string();
        } else if  macd_line[i].value < signal_line[i].value {
            signals[i] = "sell".to_string();
        }
    }

    Ok(calculate_performance(&custom_quotes, &signals))
}

#[tauri::command]
async fn three_ema_strategy(symbol: &str, timeframe: &str, from: &str, to:&str, period1: usize, period2: usize, period3: usize) -> Result<StrategyResult, String> {
    let data = fetch_stock_data_for_backtest(symbol, timeframe, from, to).await.unwrap();
    let filtered_data = filter_complete_quotes(data);
    let custom_quotes = transform_to_custom_quotes(filtered_data);
    let ema1 = calculate_ema(&custom_quotes, period1);
    let ema2 = calculate_ema(&custom_quotes, period2);
    let ema3 = calculate_ema(&custom_quotes, period3);

    let mut signals = vec!["hold".to_string(); custom_quotes.len()];
    for i in 1..custom_quotes.len() {
        if ema1[i].value > ema2[i].value && ema2[i].value > ema3[i].value {
            signals[i] = "buy".to_string();
        } else if ema1[i].value < ema2[i].value && ema2[i].value < ema3[i].value {
            signals[i] = "sell".to_string();
        }
    }

    Ok(calculate_performance(&custom_quotes, &signals))
}


#[tauri::command]
async fn add_item(item: String) -> Result<(), String> {
    let timeframes = vec!["1M", "1H", "1D", "1WK"];
    let mut data = Vec::new();

    for timeframe in timeframes.iter() {
        if let Ok(data_item) = fetch_initial_data(&item, timeframe).await {
            data.push((timeframe.to_string(), data_item));
        }
    }

    let mut data_map = STOCK_DATA
        .write()
        .map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
    let stock_model = data_map
        .entry("stocks".to_string())
        .or_insert_with(StockModel::new);

    if !stock_model.stock_datas.contains_key(&item) {
        stock_model.initialize_timeframes(&item);
        for (timeframe, data_item) in data {
            stock_model.append_data(&item, &timeframe, data_item);
        }
    }

    Ok(())
}

#[tauri::command]
async fn get_data(symbol: String, timeframe: String) -> Result<Vec<CustomQuote>, String> {
    let data_map = STOCK_DATA
        .read()
        .map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
    let stock_model = data_map.get("stocks").ok_or("Stock data not found")?;
    let stock_data = stock_model
        .stock_datas
        .get(&symbol)
        .and_then(|tf_map| tf_map.get(&timeframe))
        .ok_or("Stock data not found for the given key")?;
    Ok(stock_data.chart_data.clone())
}


#[tauri::command]
async fn get_range(symbol: String, timeframe: String) -> Result<DateRange, String> {
    let data_map = STOCK_DATA
        .read()
        .map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
    let stock_model = data_map.get("stocks").ok_or("Stock data not found")?;
    let stock_data = stock_model
        .stock_datas
        .get(&symbol)
        .and_then(|tf_map| tf_map.get(&timeframe))
        .ok_or("Stock data not found for the given key")?;

    Ok(DateRange {
        from: stock_data.from,
        to: stock_data.to,
    })
}

#[tauri::command]
fn get_labels() -> Vec<String> {
    let data_map = STOCK_DATA
        .read()
        .map_err(|_| "Failed to acquire lock on STOCK_DATA")
        .unwrap();
    let stock_model = data_map.get("stocks").unwrap();
    let mut unique_labels: Vec<String> = Vec::new();
    let mut seen_symbols = std::collections::HashSet::new();

    for symbol in stock_model.stock_datas.keys() {
        if seen_symbols.insert(symbol.to_string()) {
            unique_labels.push(symbol.to_string());
        }
    }

    unique_labels
}

#[tauri::command]
async fn delete_label(label: String) -> Result<(), String> {
    let mut data_map = STOCK_DATA
        .write()
        .map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
    let stock_model = data_map.get_mut("stocks").ok_or("Stock data not found")?;
    stock_model.stock_datas.remove(&label);
    Ok(())
}

#[tauri::command]
async fn search_indices(query: String) -> Result<Vec<String>, String> {
    let client = reqwest::Client::new();
    let url = format!("http://localhost:3000/search-stocks/{}", query);

    let response = client.get(&url).send().await;
    if let Err(e) = response {
        return Err(format!("Failed to fetch stock data: {}", e));
    }
    let response = response.unwrap();
    if !response.status().is_success() {
        return Err(format!(
            "Failed to fetch stock data: HTTP {}",
            response.status()
        ));
    }
    let data: Vec<String> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    Ok(data)
}

#[tokio::main]
async fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(close));
    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);

    tauri::Builder::default()
        .setup(|app| {

            tokio::task::block_in_place(|| {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(async {
                    if let Err(e) = initialize_data().await {
                        eprintln!("Failed to initialize data: {}", e);
                    }
                });
            });

            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .menu(menu)
        .invoke_handler(tauri::generate_handler![
            fetch_stock_chart,
            get_labels,
            search_indices,
            add_item,
            get_data,
            get_range,
            delete_label,
            get_indicators,
            macd_strategy,
            alligator_strategy,
            three_ema_strategy,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
