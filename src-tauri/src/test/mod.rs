use chrono::{DateTime, Utc, NaiveDate};
use serde::{Deserialize, Serialize};

pub mod fetch_stock_from_api;

#[derive(Serialize, Deserialize, Debug)]
pub struct StockQuote {
    high: f64,
    volume: u64,
    open: f64,
    low: f64,
    close: f64,
    adjclose: f64,
    date: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct StockData {
    meta: MetaData,
    quotes: Vec<StockQuote>,
    events: EventsData,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EventsData {}

#[derive(Serialize, Deserialize, Debug)]
pub struct MetaData {} 

#[derive(Serialize, Debug)]
pub struct CustomQuote {
    high: f64,
    volume: u64,
    open: f64,
    low: f64,
    close: f64,
    adjclose: f64,
    time: NaiveDate,
}
