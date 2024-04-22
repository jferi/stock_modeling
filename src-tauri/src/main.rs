#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use tauri::Manager;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Serialize, Deserialize, Debug)]
struct StockQuote {
    high: f64,
    volume: u64,
    open: f64,
    low: f64,
    close: f64,
    adjclose: f64,
    date: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug)]
struct StockData {
    meta: MetaData,
    quotes: Vec<StockQuote>,
    events: EventsData,
}

#[derive(Serialize, Deserialize, Debug)]
struct MetaData {
    
}

#[derive(Serialize, Deserialize, Debug)]
struct EventsData {
    
}


#[derive(Serialize, Debug)]
struct CustomQuote {
    high: f64,
    volume: u64,
    open: f64,
    low: f64,
    close: f64,
    adjclose: f64,
    time: NaiveDate,
}


#[tauri::command]
async fn fetch_stock_chart(symbol: String) -> Result<Vec<CustomQuote>, String> {
    let client = reqwest::Client::new();
    let url = format!("http://localhost:3000/api/stock/chart/{}", symbol);

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if response.status().is_success() {
        let stock_data: StockData = response.json().await.map_err(|e| e.to_string())?;

        let custom_quotes: Vec<CustomQuote> = stock_data.quotes.iter().map(|quote| {
            CustomQuote {
                high: quote.high,
                volume: quote.volume,
                open: quote.open,
                low: quote.low,
                close: quote.close,
                adjclose: quote.adjclose,
                time: quote.date.date_naive(),
            }
        }).collect();

        Ok(custom_quotes)
    } else {
        Err(format!("Failed to fetch stock data: HTTP {}", response.status()))
    }
}

#[tauri::command]
fn get_labels() -> Vec<String> {
  vec!["AAPL".into(), "GOOGL".into(), "MSFT".into(), "AMZN".into(), "TSLA".into()]
}


fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(close));
    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())}
        )
        .menu(menu)
        .invoke_handler(tauri::generate_handler![get_labels, fetch_stock_chart])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
