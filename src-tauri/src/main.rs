#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod test;

use tauri::Manager;

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

lazy_static! {
    static ref ITEMS: Arc<Mutex<Vec<String>>> = {
        let items = Arc::new(Mutex::new(Vec::new()));
        items.lock().unwrap().push("AAPL".to_string());
        items
    };
}

#[tauri::command]
async fn add_item(item: String) -> Result<(), String> {
    let mut items = ITEMS.lock().unwrap();
    if !items.contains(&item) {
        items.push(item);
    }
    Ok(())
}

#[tauri::command]
fn get_labels() -> Vec<String> {
  ITEMS.lock().unwrap().clone()
}


#[tauri::command]
async fn search_indices(query: String) -> Result<Vec<String>, String> {
    let client = reqwest::Client::new();
    let url = format!("http://localhost:3000/search-stocks/{}", query);

    let response = client.get(&url).send().await;
    if let Err(e) = response {
        return Err(format!("Failed to fetch stock data: {}", e));
    }
    let response = response.unwrap(); 
    if !response.status().is_success() {
        return Err(format!("Failed to fetch stock data: HTTP {}", response.status()));
    }

    // Extract the data from the response and return it
    let data: Vec<String> = response.json().await.map_err(|e| format!("Failed to parse response: {}", e))?;
    Ok(data)
}


fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(close));
    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())}
        )
        .menu(menu)
        .invoke_handler(tauri::generate_handler![get_labels, test::fetch_stock_from_api::fetch_stock_chart, search_indices, add_item])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
