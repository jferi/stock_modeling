use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Debug)]
pub struct StockQuote {
    pub high: Option<f64>,
    pub volume: Option<u64>,
    pub open: Option<f64>,
    pub low: Option<f64>,
    pub close: Option<f64>,
    pub date: DateTime<Utc>,
}

#[derive(Serialize, Debug, Clone, Deserialize, PartialEq)]
pub struct CustomQuote {
    pub high: Option<f64>,
    pub volume: Option<u64>,
    pub open: Option<f64>,
    pub low: Option<f64>,
    pub close: Option<f64>,
    pub time: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct DateRange {
    pub from: DateTime<Utc>,
    pub to: DateTime<Utc>,
}

#[derive(Debug, Serialize, Clone)]
pub struct IndicatorData {
    pub time: DateTime<Utc>,
    pub value: f64,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct EventsData;

#[derive(Serialize, Deserialize, Debug)]
pub struct MetaData;
