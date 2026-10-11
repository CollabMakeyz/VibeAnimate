#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod diagnostics;

use diagnostics::{DiagnosticLog, LogEvent};
use serde::Serialize;
use tauri::{Manager, State};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeInfo {
    version: &'static str,
    os: &'static str,
    architecture: &'static str,
    protocol_version: u32,
}

#[tauri::command]
fn runtime_info() -> RuntimeInfo {
    RuntimeInfo {
        version: env!("CARGO_PKG_VERSION"),
        os: std::env::consts::OS,
        architecture: std::env::consts::ARCH,
        protocol_version: 1,
    }
}

#[tauri::command]
fn log_event(event: LogEvent, log: State<'_, DiagnosticLog>) -> Result<(), String> {
    log.append(event).map_err(|error| error.to_string())
}

#[tauri::command]
fn read_logs(log: State<'_, DiagnosticLog>) -> Result<String, String> {
    log.read_recent().map_err(|error| error.to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let log = DiagnosticLog::new(app.path().app_log_dir()?)?;
            log.append(LogEvent::startup())?;
            app.manage(log);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![runtime_info, log_event, read_logs])
        .run(tauri::generate_context!())
        .expect("VibeAnimate could not start its native runtime");
}
