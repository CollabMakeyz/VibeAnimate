use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

const MAX_LOG_BYTES: u64 = 1_048_576;
const MAX_MESSAGE_CHARS: usize = 512;

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Level {
    Info,
    Warn,
    Error,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum EventCode {
    Startup,
    FrontendReady,
    FrontendError,
    DiagnosticsRequested,
    Recovery,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct LogEvent {
    pub level: Level,
    pub code: EventCode,
    pub message: String,
}

impl LogEvent {
    pub fn startup() -> Self {
        Self {
            level: Level::Info,
            code: EventCode::Startup,
            message: "Native runtime started".into(),
        }
    }
}

pub struct DiagnosticLog {
    directory: PathBuf,
    lock: Mutex<()>,
}

impl DiagnosticLog {
    pub fn new(directory: PathBuf) -> io::Result<Self> {
        fs::create_dir_all(&directory)?;
        Ok(Self {
            directory,
            lock: Mutex::new(()),
        })
    }

    pub fn append(&self, event: LogEvent) -> io::Result<()> {
        if event.message.chars().count() > MAX_MESSAGE_CHARS {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Log message exceeds 512 characters",
            ));
        }
        let _guard = self
            .lock
            .lock()
            .map_err(|_| io::Error::other("Log lock unavailable"))?;
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(io::Error::other)?
            .as_millis();
        let mut record =
            serde_json::to_vec(&serde_json::json!({"timestampMs": now, "event": event}))?;
        record.push(b'\n');
        let current = self.directory.join("current.jsonl");
        let current_size = match fs::metadata(&current) {
            Ok(meta) => meta.len(),
            Err(error) if error.kind() == io::ErrorKind::NotFound => 0,
            Err(error) => return Err(error),
        };
        if current_size + record.len() as u64 > MAX_LOG_BYTES {
            let previous = self.directory.join("previous.jsonl");
            match fs::remove_file(&previous) {
                Ok(()) => (),
                Err(error) if error.kind() == io::ErrorKind::NotFound => (),
                Err(error) => return Err(error),
            }
            fs::rename(&current, previous)?;
        }
        OpenOptions::new()
            .create(true)
            .append(true)
            .open(current)?
            .write_all(&record)
    }

    pub fn read_recent(&self) -> io::Result<String> {
        let _guard = self
            .lock
            .lock()
            .map_err(|_| io::Error::other("Log lock unavailable"))?;
        let path = self.directory.join("current.jsonl");
        if fs::metadata(&path)?.len() > MAX_LOG_BYTES {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Log exceeds size limit",
            ));
        }
        fs::read_to_string(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn with_log(test: impl FnOnce(&DiagnosticLog)) {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let directory =
            std::env::temp_dir().join(format!("vibeanimate-log-{}-{unique}", std::process::id()));
        let log = DiagnosticLog::new(directory.clone()).unwrap();
        test(&log);
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn writes_real_structured_records_and_escapes_newlines() {
        with_log(|log| {
            log.append(LogEvent {
                message: "line one\nline two".into(),
                ..LogEvent::startup()
            })
            .unwrap();
            let text = log.read_recent().unwrap();
            assert_eq!(text.lines().count(), 1);
            let value: serde_json::Value = serde_json::from_str(&text).unwrap();
            assert_eq!(value["event"]["message"], "line one\nline two");
            assert!(value["timestampMs"].as_u64().unwrap() > 0);
        });
    }

    #[test]
    fn rejects_oversized_messages_without_writing() {
        with_log(|log| {
            let result = log.append(LogEvent {
                message: "x".repeat(513),
                ..LogEvent::startup()
            });
            assert_eq!(result.unwrap_err().kind(), io::ErrorKind::InvalidInput);
            assert!(!log.directory.join("current.jsonl").exists());
        });
    }

    #[test]
    fn rotates_at_size_limit_and_keeps_one_previous_file() {
        with_log(|log| {
            fs::write(
                log.directory.join("current.jsonl"),
                vec![b'x'; MAX_LOG_BYTES as usize],
            )
            .unwrap();
            fs::write(log.directory.join("previous.jsonl"), b"old").unwrap();
            log.append(LogEvent::startup()).unwrap();
            assert_eq!(
                fs::metadata(log.directory.join("previous.jsonl"))
                    .unwrap()
                    .len(),
                MAX_LOG_BYTES
            );
            assert!(log.read_recent().unwrap().contains("startup"));
            assert_eq!(fs::read_dir(&log.directory).unwrap().count(), 2);
        });
    }

    #[test]
    fn ipc_schema_rejects_unknown_events_levels_and_fields() {
        for input in [
            r#"{"level":"trace","code":"startup","message":"x"}"#,
            r#"{"level":"info","code":"arbitrary","message":"x"}"#,
            r#"{"level":"info","code":"startup","message":"x","path":"elsewhere"}"#,
        ] {
            assert!(serde_json::from_str::<LogEvent>(input).is_err());
        }
    }
}
