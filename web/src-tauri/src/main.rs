// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
struct DocumentPayload {
    path: String,
    name: String,
    content: String,
}

#[tauri::command]
fn read_md_file(path: String) -> Result<DocumentPayload, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("File not found: {}", path));
    }
    let content = fs::read_to_string(p).map_err(|e| e.to_string())?;
    let name = p
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Untitled.md".to_string());

    Ok(DocumentPayload {
        path,
        name,
        content,
    })
}

#[tauri::command]
fn save_md_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![read_md_file, save_md_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
