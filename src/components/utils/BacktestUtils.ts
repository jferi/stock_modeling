export const strategies = ["MACD", "Triple EMA", "Alligator"];

export interface StrategyResult {
  signals: string[];
  dates: string[];
  num_trades: number;
  winning_trades: number;
  losing_trades: number;
  winning_percentage: number;
  profit_factor: number;
  final_capital: number;
  total_return_percentage: number;
}
