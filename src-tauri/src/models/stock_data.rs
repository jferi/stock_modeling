use chrono::{DateTime, Utc};

use crate::types::CustomQuote;


#[derive(Debug)]
pub struct StockData {
    pub chart_data: Vec<CustomQuote>,
    pub from: DateTime<Utc>,
    pub to: DateTime<Utc>,
}

impl StockData {
    pub fn new(from: DateTime<Utc>, to: DateTime<Utc>) -> Self {
        Self {
            chart_data: Vec::new(),
            from,
            to,
        }
    }

    pub fn update_period(&mut self, new_from: DateTime<Utc>, new_to: DateTime<Utc>) {
        self.from = new_from;
        self.to = new_to;
    }
}