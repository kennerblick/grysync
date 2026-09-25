//! Detection of the installed rsync binary.

use serde::Serialize;
use std::process::{Command, Stdio};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RsyncInfo {
    pub program: String,
    /// e.g. `3.2.7`
    pub version: String,
    pub protocol: Option<u32>,
    /// `rsync` (samba) or `openrsync` (shipped with recent macOS).
    pub flavor: String,
    pub raw: String,
}

/// The program to run when the user did not configure one.
pub fn default_program() -> String {
    "rsync".to_string()
}

pub fn detect(program: &str) -> Result<RsyncInfo, String> {
    let mut cmd = Command::new(program);
    cmd.arg("--version")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    crate::runner::hide_console(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Could not start `{program}`: {e}"))?;
    let raw = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    parse_version(program, &raw).ok_or_else(|| format!("`{program}` does not look like rsync"))
}

pub fn parse_version(program: &str, raw: &str) -> Option<RsyncInfo> {
    let flavor = if raw.contains("openrsync") {
        "openrsync"
    } else {
        "rsync"
    };

    let mut version = None;
    let mut protocol = None;
    for line in raw.lines() {
        let words: Vec<&str> = line.split_whitespace().collect();
        for i in 1..words.len() {
            // Skip "protocol version NN"; we want "rsync version X.Y.Z".
            let after_protocol = i >= 2 && words[i - 2] == "protocol";
            if version.is_none()
                && !after_protocol
                && words[i - 1] == "version"
                && words[i].starts_with(|c: char| c.is_ascii_digit())
            {
                version = Some(words[i].to_string());
            }
        }
        if protocol.is_none() {
            if let Some(rest) = line.split("protocol version").nth(1) {
                protocol = rest
                    .trim()
                    .split(|c: char| !c.is_ascii_digit())
                    .next()
                    .and_then(|n| n.parse().ok());
            }
        }
    }

    Some(RsyncInfo {
        program: program.to_string(),
        version: version?,
        protocol,
        flavor: flavor.to_string(),
        raw: raw.trim().to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_samba_rsync() {
        let raw = "rsync  version 3.2.7  protocol version 31\nCopyright (C) 1996-2022 by Andrew Tridgell, Wayne Davison, and others.\n";
        let info = parse_version("rsync", raw).unwrap();
        assert_eq!(info.version, "3.2.7");
        assert_eq!(info.protocol, Some(31));
        assert_eq!(info.flavor, "rsync");
    }

    #[test]
    fn parses_openrsync() {
        let raw = "openrsync: protocol version 29\nrsync version 2.6.9 compatible\n";
        let info = parse_version("rsync", raw).unwrap();
        assert_eq!(info.version, "2.6.9");
        assert_eq!(info.protocol, Some(29));
        assert_eq!(info.flavor, "openrsync");
    }

    #[test]
    fn rejects_garbage() {
        assert!(parse_version("ls", "ls: unrecognized option '--version'").is_none());
    }
}
