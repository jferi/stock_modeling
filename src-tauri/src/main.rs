#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod test;
use reqwest::StatusCode;
use serde::Serialize;
use tauri::Manager;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use chrono::{DateTime, Duration, TimeZone, Utc};
use test::{fetch_stock_from_api, CustomQuote, StockQuote};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use lazy_static::lazy_static;

#[derive(Debug)]
struct StockData {
    chart_data: Vec<CustomQuote>,
    from: DateTime<Utc>,
    to: DateTime<Utc>,
}

impl StockData {
    fn new(from: DateTime<Utc>, to: DateTime<Utc>) -> Self {
        Self {
            chart_data: Vec::new(),
            from,
            to,
        }
    }

    fn update_period(&mut self, new_from: DateTime<Utc>, new_to: DateTime<Utc>) {
        self.from = new_from;
        self.to = new_to;
    }

}

#[derive(Debug)]
struct StockModel {
    stock_datas: HashMap<String, HashMap<String, StockData>>,
}

impl StockModel {
    fn new() -> Self {
        Self {
            stock_datas: HashMap::new(),
        }
    }

    fn initialize_timeframes(&mut self, symbol: &str) {
        let now = Utc::now();
        let min_date = Utc.with_ymd_and_hms(2000, 1, 1, 0, 0, 0).unwrap();
        
        let timeframes = vec![
            ("1M", now - Duration::days(3)),
            ("1H", now - Duration::weeks(15)),
            ("1D", now - Duration::days(4 * 365)),
            ("1WK", now - Duration::days(7 * 365)),
        ];

        let mut timeframe_map = HashMap::new();
        for (interval, from) in timeframes {
            let adjusted_from = if from < min_date { min_date } else { from };
            timeframe_map.insert(interval.to_string(), StockData::new(adjusted_from, now));
        }

        self.stock_datas.insert(symbol.to_string(), timeframe_map);
    }

    fn get_data(&self, symbol: &str, interval: &str) -> Option<&Vec<CustomQuote>> {
        self.stock_datas
            .get(symbol)
            .and_then(|timeframe_map| timeframe_map.get(interval))
            .map(|stock_data| &stock_data.chart_data)
    }

    fn update_period(&mut self, symbol: &str, interval: &str, new_from: DateTime<Utc>, new_to: DateTime<Utc>) {
        if let Some(timeframe_map) = self.stock_datas.get_mut(symbol) {
            if let Some(stock_data) = timeframe_map.get_mut(interval) {
                stock_data.update_period(new_from, new_to);
            }
        }
    }

    fn remove_data(&mut self, symbol: &str, interval: &str, time: DateTime<Utc>) {
        if let Some(timeframe_map) = self.stock_datas.get_mut(symbol) {
            if let Some(stock_data) = timeframe_map.get_mut(interval) {
                stock_data.chart_data.retain(|quote| quote.time != time);
            }
        }
    }

    fn append_data(&mut self, symbol: &str, interval: &str, new_data: Vec<CustomQuote>) {
        if let Some(timeframe_map) = self.stock_datas.get_mut(symbol) {
            if let Some(stock_data) = timeframe_map.get_mut(interval) {
                let existing_data = &mut stock_data.chart_data;

                let mut filtered_new_data: Vec<CustomQuote> = Vec::new();
                for new_quote in new_data {
                    if !existing_data.iter().any(|existing_quote| existing_quote == &new_quote) {
                        filtered_new_data.push(new_quote);
                    }
                }

                if !filtered_new_data.is_empty() {
                    filtered_new_data.extend(existing_data.clone());
                    existing_data.clear();
                    existing_data.extend(filtered_new_data);
                }
            }
        }
    }
}

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

async fn fetch_initial_data(symbol: &str, timeframe: &str) -> Result<Vec<CustomQuote>, String> {
    let client = reqwest::Client::new();
    let now = Utc::now();
    let from = match timeframe {
        "1M" => now - Duration::days(3),
        "1H" => now - Duration::weeks(15),
        "1D" => now - Duration::days(4 * 365),
        "1WK" => now - Duration::days(7 * 365),
        _ => return Err("Invalid timeframe".to_string()),
    };
    let url = format!(
        "http://localhost:3000/stock/chart/{}?timeframe={}&period1={}&period2={}",
        symbol, timeframe, from, now
    );
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    match response.status() {
        StatusCode::OK => {
            let stock_data: Vec<StockQuote> = response.json().await.map_err(|e| e.to_string())?;
            let filtered_data = fetch_stock_from_api::filter_complete_quotes(stock_data);
            let custom_quotes = fetch_stock_from_api::transform_to_custom_quotes(filtered_data);
            Ok(custom_quotes)
        },
        status => Err(format!("Reached end of data {}", status)),
    }
}

async fn initialize_data() -> Result<(), String> {
    let symbols = vec!["AAPL", "GOOGL", "AMZN"];
    let timeframes = vec!["1M", "1H", "1D", "1WK"];

    for symbol in symbols {
        for timeframe in timeframes.iter() {
            let data = fetch_initial_data(symbol, timeframe).await?;

            let mut data_map = STOCK_DATA.write().unwrap();
            let stock_model = data_map.get_mut("stocks").unwrap();
            
            stock_model.append_data(symbol, timeframe, data.clone());
            
            let stock_data = stock_model
                .stock_datas
                .get(symbol)
                .and_then(|tf_map| tf_map.get(*timeframe))
                .unwrap();
            let from = stock_data.from;
            let new_from = from - match *timeframe {
                "1M" => Duration::days(3),
                "1H" => Duration::weeks(15),
                "1D" => Duration::days(4 * 365),
                "1WK" => Duration::days(7 * 365),
                _ => return Err("Invalid timeframe".to_string()),
            };

            print!("{}, {}, Old from: {}, new from: {}", &symbol, &timeframe, &from.date_naive(), &new_from.date_naive());

            stock_model.update_period(symbol, timeframe, new_from, from);
        }
    }
    Ok(())
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

    let mut data_map = STOCK_DATA.write().map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
    let stock_model = data_map.entry("stocks".to_string()).or_insert_with(StockModel::new);

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
    let data_map = STOCK_DATA.read().map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
    let stock_model = data_map.get("stocks").ok_or("Stock data not found")?;
    println!("Getting data for symbol: {}, timeframe: {}", symbol, timeframe);
    let stock_data = stock_model
        .stock_datas
        .get(&symbol)
        .and_then(|tf_map| tf_map.get(&timeframe))
        .ok_or("Stock data not found for the given key")?;
    Ok(stock_data.chart_data.clone())
}

#[derive(Debug, Serialize)]
pub struct DateRange {
    pub from: DateTime<Utc>,
    pub to: DateTime<Utc>,
}

#[tauri::command]
async fn get_range(symbol: String, timeframe: String) -> Result<DateRange, String> {
    let data_map = STOCK_DATA.read().map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
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
    let data_map = STOCK_DATA.read().map_err(|_| "Failed to acquire lock on STOCK_DATA").unwrap();
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
    let mut data_map = STOCK_DATA.write().map_err(|_| "Failed to acquire lock on STOCK_DATA")?;
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
        return Err(format!("Failed to fetch stock data: HTTP {}", response.status()));
    }
    let data: Vec<String> = response.json().await.map_err(|e| format!("Failed to parse response: {}", e))?;
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
            test::fetch_stock_from_api::fetch_stock_chart, 
            get_labels, 
            search_indices, 
            add_item, 
            get_data,
            get_range,
            delete_label,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
