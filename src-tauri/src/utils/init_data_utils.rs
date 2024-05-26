use chrono::{Duration, Utc};
use reqwest::StatusCode;
use crate::{types::{CustomQuote, StockQuote}, STOCK_DATA};

use super::fetch_stock_utils::{filter_complete_quotes, transform_to_custom_quotes};

pub  async fn fetch_initial_data(symbol: &str, timeframe: &str) -> Result<Vec<CustomQuote>, String> {
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
            let filtered_data = filter_complete_quotes(stock_data);
            let custom_quotes = transform_to_custom_quotes(filtered_data);
            Ok(custom_quotes)
        }
        status => Err(format!("Reached end of data {}", status)),
    }
}

pub async fn initialize_data() -> Result<(), String> {
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
            let new_from = from
                - match *timeframe {
                    "1M" => Duration::days(3),
                    "1H" => Duration::weeks(15),
                    "1D" => Duration::days(4 * 365),
                    "1WK" => Duration::days(7 * 365),
                    _ => return Err("Invalid timeframe".to_string()),
                };

            print!(
                "{}, {}, Old from: {}, new from: {}",
                &symbol,
                &timeframe,
                &from.date_naive(),
                &new_from.date_naive()
            );

            stock_model.update_period(symbol, timeframe, new_from, from);
        }
    }
    Ok(())
}