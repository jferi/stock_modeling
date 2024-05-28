    use std::collections::HashMap;

    use chrono::{DateTime, Duration, TimeZone, Utc};

    use crate::types::CustomQuote;
    use crate::models::stock_data::StockData;


    #[derive(Debug)]
    pub struct StockModel {
        pub stock_datas: HashMap<String, HashMap<String, StockData>>,
    }

    impl StockModel {
        pub fn new() -> Self {
            Self {
                stock_datas: HashMap::new(),
            }
        }

        pub fn initialize_timeframes(&mut self, symbol: &str) {
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

        pub fn get_data(&self, symbol: &str, interval: &str) -> Option<&Vec<CustomQuote>> {
            self.stock_datas
                .get(symbol)
                .and_then(|timeframe_map| timeframe_map.get(interval))
                .map(|stock_data| &stock_data.chart_data)
        }

        pub fn update_period(
            &mut self,
            symbol: &str,
            interval: &str,
            new_from: DateTime<Utc>,
            new_to: DateTime<Utc>,
        ) {
            if let Some(timeframe_map) = self.stock_datas.get_mut(symbol) {
                if let Some(stock_data) = timeframe_map.get_mut(interval) {
                    stock_data.update_period(new_from, new_to);
                }
            }
        }

        pub fn remove_data(&mut self, symbol: &str, interval: &str, time: DateTime<Utc>) {
            if let Some(timeframe_map) = self.stock_datas.get_mut(symbol) {
                if let Some(stock_data) = timeframe_map.get_mut(interval) {
                    stock_data.chart_data.retain(|quote| quote.time != time);
                }
            }
        }

        pub fn append_data(&mut self, symbol: &str, interval: &str, new_data: Vec<CustomQuote>) {
            if let Some(timeframe_map) = self.stock_datas.get_mut(symbol) {
                if let Some(stock_data) = timeframe_map.get_mut(interval) {
                    let existing_data = &mut stock_data.chart_data;

                    let mut filtered_new_data: Vec<CustomQuote> = Vec::new();
                    for new_quote in new_data {
                        if !existing_data
                            .iter()
                            .any(|existing_quote| existing_quote == &new_quote)
                        {
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

        pub fn update_data(&mut self, symbol: &str, interval: &str, updated_data: Vec<CustomQuote>) {
            if let Some(timeframe_map) = self.stock_datas.get_mut(symbol) {
                if let Some(stock_data) = timeframe_map.get_mut(interval) {
                    stock_data.chart_data.clear();
                    stock_data.chart_data.extend(updated_data);
                }
            }
        }
    }


    #[cfg(test)]
    mod tests {
        use super::*;
    
        #[test]
        fn test_stock_model_new() {
            let stock_model = StockModel::new();
            assert!(stock_model.stock_datas.is_empty());
        }
    
        #[test]
        fn test_initialize_timeframes() {
            let mut stock_model = StockModel::new();
            stock_model.initialize_timeframes("AAPL");
    
            let timeframes = stock_model.stock_datas.get("AAPL").unwrap();
            assert!(timeframes.contains_key("1M"));
            assert!(timeframes.contains_key("1H"));
            assert!(timeframes.contains_key("1D"));
            assert!(timeframes.contains_key("1WK"));
        }
    
        #[test]
        fn test_get_data() {
            let mut stock_model = StockModel::new();
            stock_model.initialize_timeframes("AAPL");
            let data = stock_model.get_data("AAPL", "1M");
            assert!(data.is_some());
        }
    }
    