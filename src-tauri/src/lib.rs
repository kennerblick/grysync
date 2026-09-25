mod progress;
mod rsync;
mod runner;
mod store;

use runner::{RunEvent, Runner};
use std::sync::Arc;
use tauri::ipc::Channel;
use tauri::{AppHandle, State};

fn program_or_default(program: Option<String>) -> String {
    program
        .map(|p| p.trim().to_string())
        .filter(|p| !p.is_empty())
        .unwrap_or_else(rsync::default_program)
}

#[tauri::command]
async fn rsync_info(program: Option<String>) -> Result<rsync::RsyncInfo, String> {
    rsync::detect(&program_or_default(program))
}

#[tauri::command]
fn start_sync(
    runner: State<'_, Arc<Runner>>,
    program: Option<String>,
    args: Vec<String>,
    on_event: Channel<RunEvent>,
) -> Result<u32, String> {
    runner.start(&program_or_default(program), args, on_event)
}

#[tauri::command]
fn cancel_sync(runner: State<'_, Arc<Runner>>, run_id: u32) -> Result<(), String> {
    runner.cancel(run_id)
}

#[tauri::command]
fn load_state(app: AppHandle) -> Result<Option<serde_json::Value>, String> {
    store::load(&app)
}

#[tauri::command]
fn save_state(app: AppHandle, state: serde_json::Value) -> Result<(), String> {
    store::save(&app, &state)
}

#[tauri::command]
fn config_path(app: AppHandle) -> Result<String, String> {
    store::config_path(&app)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Arc::new(Runner::default()))
        .invoke_handler(tauri::generate_handler![
            rsync_info,
            start_sync,
            cancel_sync,
            load_state,
            save_state,
            config_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running grysync");
}
