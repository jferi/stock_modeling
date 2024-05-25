use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

pub mod fetch_stock_from_api;

#[derive(Serialize, Deserialize, Debug)]
pub struct StockQuote {
    high: Option<f64>,
    volume: Option<u64>,
    open: Option<f64>,
    low: Option<f64>,
    close: Option<f64>,
    date: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EventsData;

#[derive(Serialize, Deserialize, Debug)]
pub struct MetaData;

#[derive(Serialize, Debug, Clone, Deserialize, PartialEq)]
pub struct CustomQuote {
    pub high: Option<f64>,
    pub volume: Option<u64>,
    pub open: Option<f64>,
    pub low: Option<f64>,
    pub close: Option<f64>,
    pub time: DateTime<Utc>,
}
