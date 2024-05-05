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


#[derive(Serialize, Debug)]
pub struct CustomQuote {
    high: Option<f64>,
    volume: Option<u64>,
    open: Option<f64>,
    low: Option<f64>,
    close: Option<f64>,
    time: DateTime<Utc>,
}