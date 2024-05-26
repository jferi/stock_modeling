# Stock Modeling

This repository contains a stock modeling application built using Tauri, React, and TypeScript. The application allows users to perform technical analysis and backtesting on various stocks.

## Features

- **Technical Indicators:** Calculate and visualize various technical indicators such as SMA, EMA, RSI, MACD, and Volume.
- **Stock Data Fetching:** Retrieve and display stock data from external sources.
- **Backtesting:** Perform backtests using predefined strategies.
- **Responsive UI:** A user-friendly interface built with React and Tailwind CSS.

## Recommended IDE Setup

- **VS Code**
  - Tauri
  - rust-analyzer

## Getting Started

### Prerequisites

- Node.js
- Rust
- Tauri CLI

### Installation

1. Clone the repository

   ```sh
   git clone https://github.com/jferi/stock_modeling.git
   cd stock_modeling
   ```

2. Install dependencies

   ```sh
   yarn install
   ```

3. Build the project

   ```sh
   yarn build
   ```

4. Run the development server

   ```sh
   yarn dev
   ```

### Running the Application

1. Start the Node.js server in a separate terminal

```sh
cd api
node server.js
```

2. Run the Tauri application

```sh
yarn tauri dev
```
