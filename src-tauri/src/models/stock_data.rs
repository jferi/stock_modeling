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

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn test_stock_data_new() {
        let from = Utc.with_ymd_and_hms(2022, 1, 1, 0, 0, 0).unwrap();
        let to = Utc.with_ymd_and_hms(2022, 12, 31, 23, 59, 59).unwrap();
        let stock_data = StockData::new(from, to);
        assert_eq!(stock_data.from, from);
        assert_eq!(stock_data.to, to);
        assert!(stock_data.chart_data.is_empty());
    }

    #[test]
    fn test_update_period() {
        let from = Utc.with_ymd_and_hms(2022, 1, 1, 0, 0, 0).unwrap();
        let to = Utc.with_ymd_and_hms(2022, 12, 31, 23, 59, 59).unwrap();
        let mut stock_data = StockData::new(from, to);

        let new_from = Utc.with_ymd_and_hms(2021, 1, 1, 0, 0, 0).unwrap();
        let new_to = Utc.with_ymd_and_hms(2021, 12, 31, 23, 59, 59).unwrap();
        stock_data.update_period(new_from, new_to);

        assert_eq!(stock_data.from, new_from);
        assert_eq!(stock_data.to, new_to);
    }
}
