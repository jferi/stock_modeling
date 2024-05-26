type PredefinedIndicator = {
  type: string;
  variants: string[];
};

export const predefinedIndicators: PredefinedIndicator[] = [
  {
    type: "SMA",
    variants: [
      "SMA 5",
      "SMA 8",
      "SMA 13",
      "SMA 21",
      "SMA 50",
      "SMA 100",
      "SMA 200"
    ]
  },
  {
    type: "EMA",
    variants: [
      "EMA 5",
      "EMA 8",
      "EMA 13",
      "EMA 21",
      "EMA 50",
      "EMA 100",
      "EMA 200"
    ]
  },
  { type: "RSI", variants: ["RSI 7", "RSI 14", "RSI 21"] },
  { type: "MACD", variants: ["MACD 12 26 9"] },
  { type: "VOLUME", variants: ["VOLUME"] }
];
