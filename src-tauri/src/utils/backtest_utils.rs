use crate::types::{CustomQuote, StrategyResult};

const COMMISSION: f64 = 0.5;
const INITIAL_CAPITAL: f64 = 100000.0;
const LOT_SIZE: f64 = 20.0;

pub fn calculate_performance(data: &[CustomQuote], signals: &[String]) -> StrategyResult {
    let mut capital = INITIAL_CAPITAL;
    let mut num_trades = 0;
    let mut winning_trades = 0;
    let mut losing_trades = 0;
    let mut profit = 0.0;
    let mut loss = 0.0;
    let mut position = 0.0;
    let mut position_type = "";

    for i in 1..signals.len() {
        println!("Signal: {}, Close: {:?}", signals[i], data[i].close);
        match signals[i].as_str() {
            "buy" if position == 0.0 => {
                position = LOT_SIZE;
                position_type = "long";
                capital -= position * data[i].close.unwrap_or(0.0) + COMMISSION;
                num_trades += 1;
                println!("Opening long position, Capital: {}", capital);
            }
            "sell" if position == 0.0 => {
                position = LOT_SIZE;
                position_type = "short";
                capital -= position * data[i].close.unwrap_or(0.0) + COMMISSION;
                num_trades += 1;
                println!("Opening short position, Capital: {}", capital);
            }
            "sell" if position != 0.0 && position_type == "long" => {
                capital += position * data[i].close.unwrap_or(0.0) - COMMISSION;
                let trade_profit = position * (data[i].close.unwrap_or(0.0) - data[i - 1].close.unwrap_or(0.0)) - 2.0 * COMMISSION;
                if trade_profit > 0.0 {
                    winning_trades += 1;
                    profit += trade_profit;
                } else {
                    losing_trades += 1;
                    loss -= trade_profit;
                }
                position = 0.0;
                position_type = "";
                println!("Closing long position, Capital: {}", capital);
            }
            "buy" if position != 0.0 && position_type == "short" => {
                capital += position * data[i].close.unwrap_or(0.0) - COMMISSION;
                let trade_profit = position * (data[i - 1].close.unwrap_or(0.0) - data[i].close.unwrap_or(0.0)) - 2.0 * COMMISSION;
                if trade_profit > 0.0 {
                    winning_trades += 1;
                    profit += trade_profit;
                } else {
                    losing_trades += 1;
                    loss -= trade_profit;
                }
                position = 0.0;
                position_type = "";
                println!("Closing short position, Capital: {}", capital);
            }
            _ => {}
        }
    }

    let final_capital = if position != 0.0 {
        capital + position * data.last().unwrap().close.unwrap_or(0.0) - COMMISSION
    } else {
        capital
    };

    let winning_percentage = if num_trades > 0 {
        (winning_trades as f64 / num_trades as f64) * 100.0
    } else {
        0.0
    };

    let profit_factor = if loss > 0.0 {
        profit / loss
    } else {
        profit
    };

    let total_return_percentage = ((final_capital / INITIAL_CAPITAL) - 1.0) * 100.0;

    StrategyResult {
        signals: signals.to_vec(),
        dates: data.iter().map(|q| q.time.to_string()).collect(),
        num_trades,
        winning_trades,
        losing_trades,
        winning_percentage,
        profit_factor,
        final_capital,
        total_return_percentage,
    }
}
