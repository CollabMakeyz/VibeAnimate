//! Explicit test-only WebView configuration. This module is absent from release
//! builds and from normal debug builds without the `e2e` Cargo feature.
use std::path::PathBuf;

pub struct Configuration {
    pub port: u16,
    pub profile: PathBuf,
}

impl Configuration {
    pub fn parse(args: &[String]) -> Result<Option<Self>, String> {
        if args.is_empty() {
            return Ok(None);
        }
        if args.len() != 4 || args[0] != "--e2e-port" || args[2] != "--e2e-profile" {
            return Err("Expected --e2e-port PORT --e2e-profile EMPTY_ABSOLUTE_DIRECTORY".into());
        }
        let port: u16 = args[1].parse().map_err(|_| "Invalid E2E port")?;
        if port < 1024 {
            return Err("E2E port must be in 1024..65535".into());
        }
        let profile = PathBuf::from(&args[3]);
        if !profile.is_absolute() || !profile.is_dir() {
            return Err("E2E profile must be an existing absolute directory".into());
        }
        if std::fs::read_dir(&profile)
            .map_err(|e| e.to_string())?
            .next()
            .is_some()
        {
            return Err("E2E requires an empty isolated profile".into());
        }
        Ok(Some(Self { port, profile }))
    }

    pub fn browser_arguments(&self) -> String {
        format!(
            "--remote-debugging-address=127.0.0.1 --remote-debugging-port={}",
            self.port
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_missing_arguments_invalid_ports_and_relative_profiles() {
        for args in [
            vec!["--e2e-port", "9000"],
            vec!["--e2e-port", "80", "--e2e-profile", "relative"],
            vec!["--e2e-port", "70000", "--e2e-profile", "relative"],
            vec!["--e2e-port", "9222 --flag", "--e2e-profile", "relative"],
            vec!["--e2e-port", "9222", "--e2e-profile", "relative"],
        ] {
            let values = args.into_iter().map(str::to_owned).collect::<Vec<_>>();
            assert!(Configuration::parse(&values).is_err());
        }
        assert!(Configuration::parse(&[]).unwrap().is_none());
    }
    #[test]
    fn accepts_empty_profile_and_refuses_to_reuse_profile_data() {
        let nonce = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "vibeanimate-e2e-config-{}-{nonce}",
            std::process::id()
        ));
        std::fs::create_dir(&path).unwrap();
        let args = [
            "--e2e-port".into(),
            "9227".into(),
            "--e2e-profile".into(),
            path.to_string_lossy().into_owned(),
        ];
        let config = Configuration::parse(&args).unwrap().unwrap();
        assert_eq!(
            config.browser_arguments(),
            "--remote-debugging-address=127.0.0.1 --remote-debugging-port=9227"
        );
        std::fs::write(path.join("existing"), b"do not reuse").unwrap();
        assert!(Configuration::parse(&args).is_err());
        std::fs::remove_dir_all(path).unwrap();
    }
}
