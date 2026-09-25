//! Persists profiles and settings as one JSON document in the app config dir.
//! The frontend owns the schema; the backend only stores it safely.

use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const FILE_NAME: &str = "grysync.json";

fn path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("No config directory: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Could not create {}: {e}", dir.display()))?;
    Ok(dir.join(FILE_NAME))
}

pub fn load(app: &AppHandle) -> Result<Option<serde_json::Value>, String> {
    let path = path(app)?;
    match fs::read_to_string(&path) {
        Ok(text) => serde_json::from_str(&text)
            .map(Some)
            .map_err(|e| format!("{} is corrupt: {e}", path.display())),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("Could not read {}: {e}", path.display())),
    }
}

pub fn save(app: &AppHandle, state: &serde_json::Value) -> Result<(), String> {
    let path = path(app)?;
    let text = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    // Write to a temp file first so a crash never leaves a half-written file.
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, text).map_err(|e| format!("Could not write {}: {e}", tmp.display()))?;
    fs::rename(&tmp, &path).map_err(|e| format!("Could not write {}: {e}", path.display()))
}

pub fn config_path(app: &AppHandle) -> Result<String, String> {
    path(app).map(|p| p.display().to_string())
}
