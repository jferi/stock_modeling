use reqwest::StatusCode;

use super::{CustomQuote, StockData};

#[tauri::command]
pub async fn fetch_stock_chart(symbol: String) -> Result<Vec<CustomQuote>, String> {
    let stock_data = fetch_stock_data(&symbol).await?;
    let custom_quotes = transform_to_custom_quotes(stock_data);
    Ok(custom_quotes)
}

async fn fetch_stock_data(symbol: &str) -> Result<StockData, String> {
    let client = reqwest::Client::new();
    let url = format!("http://localhost:3000/api/stock/chart/{}", symbol);

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    match response.status() {
        StatusCode::OK => {
            let stock_data: StockData = response.json().await.map_err(|e| e.to_string())?;
            Ok(stock_data)
        },
        status => Err(format!("Failed to fetch stock data: HTTP {}", status))
    }
}

fn transform_to_custom_quotes(stock_data: StockData) -> Vec<CustomQuote> {
    stock_data.quotes.iter().map(|quote| {
        CustomQuote {
            high: quote.high,
            volume: quote.volume,
            open: quote.open,
            low: quote.low,
            close: quote.close,
            adjclose: quote.adjclose,
            time: quote.date.date_naive(),
        }
    }).collect()
}