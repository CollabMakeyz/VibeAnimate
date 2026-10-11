fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&["runtime_info", "log_event", "read_logs"]),
    ))
    .expect("Unable to generate application capabilities");
}
