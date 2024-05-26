use crate::types::{CustomQuote, IndicatorData};

pub fn calculate_sma(data: &[CustomQuote], period: usize) -> Vec<IndicatorData> {
    let mut sma_data = Vec::new();
    let mut sum = 0.0;

    for i in 0..data.len() {
        sum += data[i].close.unwrap_or(0.0);

        if i >= period {
            sum -= data[i - period].close.unwrap_or(0.0);
        }

        let value = if i >= period - 1 {
            sum / period as f64
        } else {
            sum / (i + 1) as f64
        };

        sma_data.push(IndicatorData { time: data[i].time, value });
    }

    sma_data
}

pub fn calculate_ema(data: &[CustomQuote], period: usize) -> Vec<IndicatorData> {
    let mut ema_data = Vec::new();
    let k = 2.0 / (period as f64 + 1.0);
    let mut ema = data[0].close.unwrap_or(0.0);

    ema_data.push(IndicatorData { time: data[0].time, value: ema });

    for i in 1..data.len() {
        let close_price = data[i].close.unwrap_or(0.0);
        ema = close_price * k + ema * (1.0 - k);
        ema_data.push(IndicatorData { time: data[i].time, value: ema });
    }

    ema_data
}

pub fn calculate_ema_for_indicator_data(data: &[IndicatorData], period: usize) -> Vec<IndicatorData> {
    let mut ema_data = Vec::new();
    let k = 2.0 / (period as f64 + 1.0);
    let mut ema = data[0].value;

    ema_data.push(IndicatorData { time: data[0].time, value: ema });

    for i in 1..data.len() {
        let value = data[i].value;
        ema = value * k + ema * (1.0 - k);
        ema_data.push(IndicatorData { time: data[i].time, value: ema });
    }

    ema_data
}

pub fn calculate_rsi(data: &[CustomQuote], period: usize) -> Vec<IndicatorData> {
    let mut rsi_data = Vec::new();

    for i in period..data.len() {
        let (mut gains, mut losses) = (0.0, 0.0);

        for j in (i - period + 1)..=i {
            let change = data[j].close.unwrap_or(0.0) - data[j - 1].close.unwrap_or(0.0);
            if change > 0.0 {
                gains += change;
            } else {
                losses -= change;
            }
        }

        let rs = if losses == 0.0 { gains } else { gains / losses };
        let rsi = 100.0 - 100.0 / (1.0 + rs);

        rsi_data.push(IndicatorData {
            time: data[i].time,
            value: rsi,
        });
    }

    rsi_data
}

pub fn calculate_macd(
    data: &[CustomQuote],
    short_period: usize,
    long_period: usize,
    signal_period: usize,
) -> (Vec<IndicatorData>, Vec<IndicatorData>, Vec<IndicatorData>) {
    let short_ema = calculate_ema(data, short_period);
    let long_ema = calculate_ema(data, long_period);
    let mut macd_line = Vec::new();

    for i in 0..short_ema.len() {
        macd_line.push(IndicatorData {
            time: short_ema[i].time,
            value: short_ema[i].value - long_ema[i].value,
        });
    }

    let signal_line = calculate_ema_for_indicator_data(&macd_line, signal_period);
    let mut macd_histogram = Vec::new();

    for i in 0..macd_line.len() {
        macd_histogram.push(IndicatorData {
            time: macd_line[i].time,
            value: macd_line[i].value - signal_line[i].value,
        });
    }

    (macd_line, signal_line, macd_histogram)
}

pub fn calculate_volume(data: &[CustomQuote]) -> Vec<IndicatorData> {
    let mut volume_data = Vec::new();
    for i in 0..data.len() {
        let value = data[i].volume.unwrap_or(0) as f64;
        volume_data.push(IndicatorData {
            time: data[i].time,
            value,
        });
    }

    volume_data
}
