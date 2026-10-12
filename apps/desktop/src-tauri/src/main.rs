#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod diagnostics;
#[cfg(all(debug_assertions, feature = "e2e", target_os = "windows"))]
mod e2e;

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
    let context = tauri::generate_context!();
    #[cfg(all(debug_assertions, feature = "e2e", target_os = "windows"))]
    let e2e = e2e::Configuration::parse(&std::env::args().skip(1).collect::<Vec<_>>())
        .expect("Invalid E2E startup configuration");
    #[cfg(all(debug_assertions, feature = "e2e", target_os = "windows"))]
    let context = {
        let mut context = context;
        if e2e.is_some() {
            context.config_mut().app.windows[0].create = false;
        }
        context
    };
    tauri::Builder::default()
        .setup(move |app| {
            let log = DiagnosticLog::new(app.path().app_log_dir()?)?;
            log.append(LogEvent::startup())?;
            app.manage(log);
            #[cfg(all(debug_assertions, feature = "e2e", target_os = "windows"))]
            if let Some(config) = &e2e {
                tauri::WebviewWindowBuilder::from_config(app, &app.config().app.windows[0])?
                    .data_directory(config.profile.clone())
                    .additional_browser_args(&config.browser_arguments())
                    .build()?;
                eprintln!(
                    "E2E WebView configured through native API on loopback port {}",
                    config.port
                );
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![runtime_info, log_event, read_logs])
        .run(context)
        .expect("VibeAnimate could not start its native runtime");
}
