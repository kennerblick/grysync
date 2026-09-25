//! Parser for rsync's progress lines (`--progress` and `--info=progress2`).
//!
//! Both formats share the same shape:
//!
//! ```text
//!       1,238,099  44%  118.08MB/s    0:00:00 (xfr#1, to-chk=3/5)
//! ```
//!
//! The trailing parenthesised part is optional; during incremental recursion
//! rsync prints `ir-chk=` instead of `to-chk=`.

use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    /// Bytes transferred so far (for progress2: of the whole run).
    pub bytes: u64,
    /// Completion percentage as reported by rsync.
    pub percent: u8,
    /// Transfer rate as printed by rsync, e.g. `118.08MB/s`.
    pub rate: String,
    /// Remaining (or, on the final line, elapsed) time, e.g. `0:00:12`.
    pub eta: String,
    /// Number of files transferred so far.
    pub transferred: Option<u64>,
    /// Files still to check.
    pub to_check: Option<u64>,
    /// Total number of files known so far.
    pub total: Option<u64>,
    /// `true` while rsync is still scanning the file list (`ir-chk`).
    pub incremental: bool,
}

/// Parses one line of rsync output. Returns `None` if it is not a progress line.
pub fn parse(line: &str) -> Option<Progress> {
    let mut tokens = line.split_whitespace();

    let bytes_token = tokens.next()?;
    if bytes_token.is_empty()
        || !bytes_token
            .chars()
            .all(|c| c.is_ascii_digit() || matches!(c, ',' | '.' | '\''))
    {
        return None;
    }
    // Thousands separators depend on the locale; the value is always an integer.
    let bytes: u64 = bytes_token
        .chars()
        .filter(char::is_ascii_digit)
        .collect::<String>()
        .parse()
        .ok()?;

    let percent: u8 = tokens.next()?.strip_suffix('%')?.parse().ok()?;

    let rate = tokens.next()?;
    if !rate.ends_with("/s") {
        return None;
    }

    let eta = tokens.next()?;
    if !eta.contains(':') {
        return None;
    }

    let mut progress = Progress {
        bytes,
        percent: percent.min(100),
        rate: rate.to_string(),
        eta: eta.to_string(),
        transferred: None,
        to_check: None,
        total: None,
        incremental: false,
    };

    for token in tokens {
        let token = token.trim_matches(|c| matches!(c, '(' | ')' | ','));
        if let Some(n) = token.strip_prefix("xfr#") {
            progress.transferred = n.parse().ok();
        } else if let Some((kind, counts)) = token.split_once('=') {
            if kind == "to-chk" || kind == "ir-chk" {
                progress.incremental = kind == "ir-chk";
                if let Some((left, total)) = counts.split_once('/') {
                    progress.to_check = left.parse().ok();
                    progress.total = total.parse().ok();
                }
            }
        }
    }

    Some(progress)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_progress2_line() {
        let p = parse("      1,238,099  44%  118.08MB/s    0:00:00 (xfr#1, to-chk=3/5)").unwrap();
        assert_eq!(p.bytes, 1_238_099);
        assert_eq!(p.percent, 44);
        assert_eq!(p.rate, "118.08MB/s");
        assert_eq!(p.eta, "0:00:00");
        assert_eq!(p.transferred, Some(1));
        assert_eq!(p.to_check, Some(3));
        assert_eq!(p.total, Some(5));
        assert!(!p.incremental);
    }

    #[test]
    fn parses_incremental_and_locale_separators() {
        let p = parse("  12.345.678  7%  1,50MB/s  0:01:02 (xfr#12, ir-chk=1000/2345)").unwrap();
        assert_eq!(p.bytes, 12_345_678);
        assert_eq!(p.percent, 7);
        assert!(p.incremental);
        assert_eq!(p.total, Some(2345));
    }

    #[test]
    fn parses_line_without_counters() {
        let p = parse("         32,768   0%    0.00kB/s    0:00:00").unwrap();
        assert_eq!(p.bytes, 32_768);
        assert_eq!(p.transferred, None);
    }

    #[test]
    fn rejects_other_output() {
        assert!(parse("sending incremental file list").is_none());
        assert!(parse(">f+++++++++ some/file.txt").is_none());
        assert!(parse("sent 1,234 bytes  received 56 bytes  2,580.00 bytes/sec").is_none());
        assert!(parse("2024 100% nope").is_none());
        assert!(parse("").is_none());
    }
}
