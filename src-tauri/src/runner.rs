//! Spawns rsync and streams its output to the frontend.
//!
//! rsync is started directly (never through a shell), so arguments reach it
//! exactly as the user entered them — no quoting or injection issues.

use crate::progress::{self, Progress};
use serde::Serialize;
use std::collections::HashMap;
use std::io::Read;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::ipc::Channel;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum RunEvent {
    #[serde(rename_all = "camelCase")]
    Started {
        run_id: u32,
        pid: u32,
    },
    #[serde(rename_all = "camelCase")]
    Line {
        stream: &'static str,
        text: String,
    },
    Progress(Progress),
    #[serde(rename_all = "camelCase")]
    Finished {
        code: Option<i32>,
        success: bool,
        cancelled: bool,
        duration_ms: u128,
    },
}

struct Run {
    child: Mutex<Child>,
    cancelled: AtomicBool,
}

#[derive(Default)]
pub struct Runner {
    next_id: AtomicU32,
    runs: Mutex<HashMap<u32, Arc<Run>>>,
}

/// Keeps Windows from flashing a console window for every child process.
pub fn hide_console(cmd: &mut Command) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    #[cfg(not(windows))]
    let _ = cmd;
}

impl Runner {
    pub fn start(
        self: &Arc<Self>,
        program: &str,
        args: Vec<String>,
        channel: Channel<RunEvent>,
    ) -> Result<u32, String> {
        let mut cmd = Command::new(program);
        cmd.args(&args)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        hide_console(&mut cmd);

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Could not start `{program}`: {e}"))?;
        let stdout = child.stdout.take().expect("stdout is piped");
        let stderr = child.stderr.take().expect("stderr is piped");
        let pid = child.id();

        let run_id = self.next_id.fetch_add(1, Ordering::Relaxed) + 1;
        let run = Arc::new(Run {
            child: Mutex::new(child),
            cancelled: AtomicBool::new(false),
        });
        self.runs.lock().unwrap().insert(run_id, run.clone());

        let _ = channel.send(RunEvent::Started { run_id, pid });

        let readers = [
            spawn_reader(stdout, "out", channel.clone()),
            spawn_reader(stderr, "err", channel.clone()),
        ];

        let runner = Arc::clone(self);
        thread::spawn(move || {
            let started = Instant::now();
            let status = loop {
                match run.child.lock().unwrap().try_wait() {
                    Ok(Some(status)) => break Some(status),
                    Ok(None) => {}
                    Err(_) => break None,
                }
                thread::sleep(Duration::from_millis(100));
            };
            // Make sure every line has been delivered before reporting the end.
            for reader in readers {
                let _ = reader.join();
            }
            runner.runs.lock().unwrap().remove(&run_id);

            let code = status.and_then(|s| s.code());
            let _ = channel.send(RunEvent::Finished {
                code,
                success: status.is_some_and(|s| s.success()),
                cancelled: run.cancelled.load(Ordering::Relaxed),
                duration_ms: started.elapsed().as_millis(),
            });
        });

        Ok(run_id)
    }

    /// Asks rsync to stop. On Unix it gets SIGTERM first so it can clean up
    /// temporary files; if it is still alive after a grace period it is killed.
    pub fn cancel(&self, run_id: u32) -> Result<(), String> {
        let run = self
            .runs
            .lock()
            .unwrap()
            .get(&run_id)
            .cloned()
            .ok_or_else(|| "This run has already finished".to_string())?;
        run.cancelled.store(true, Ordering::Relaxed);

        #[cfg(unix)]
        {
            {
                // Holding the lock keeps the waiter from reaping the child (and
                // the pid from being reused) while we signal it.
                let mut child = run.child.lock().unwrap();
                if !matches!(child.try_wait(), Ok(None)) {
                    return Ok(());
                }
                // SAFETY: plain syscall on a pid we spawned and have not reaped.
                unsafe { libc::kill(child.id() as libc::pid_t, libc::SIGTERM) };
            }
            thread::spawn(move || {
                thread::sleep(Duration::from_secs(5));
                let mut child = run.child.lock().unwrap();
                if matches!(child.try_wait(), Ok(None)) {
                    let _ = child.kill();
                }
            });
            Ok(())
        }
        #[cfg(not(unix))]
        {
            let result = run.child.lock().unwrap().kill();
            result.map_err(|e| format!("Could not stop rsync: {e}"))
        }
    }
}

/// Reads a pipe and emits one event per line. rsync redraws progress with
/// `\r`, so both `\r` and `\n` terminate a line.
fn spawn_reader(
    mut pipe: impl Read + Send + 'static,
    stream: &'static str,
    channel: Channel<RunEvent>,
) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        let mut buf = [0u8; 16 * 1024];
        let mut pending: Vec<u8> = Vec::new();
        loop {
            let n = match pipe.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => n,
            };
            pending.extend_from_slice(&buf[..n]);
            while let Some(pos) = pending.iter().position(|&b| b == b'\n' || b == b'\r') {
                let line: Vec<u8> = pending.drain(..=pos).collect();
                emit(&line[..line.len() - 1], stream, &channel);
            }
        }
        if !pending.is_empty() {
            emit(&pending, stream, &channel);
        }
    })
}

fn emit(bytes: &[u8], stream: &'static str, channel: &Channel<RunEvent>) {
    let text = String::from_utf8_lossy(bytes);
    let text = text.trim_end();
    if text.is_empty() {
        return;
    }
    let event = match (stream, progress::parse(text)) {
        ("out", Some(p)) => RunEvent::Progress(p),
        _ => RunEvent::Line {
            stream,
            text: text.to_string(),
        },
    };
    let _ = channel.send(event);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc;
    use tauri::ipc::InvokeResponseBody;

    fn channel() -> (Channel<RunEvent>, mpsc::Receiver<serde_json::Value>) {
        let (tx, rx) = mpsc::channel();
        let tx = Mutex::new(tx);
        let channel = Channel::new(move |body| {
            if let InvokeResponseBody::Json(json) = body {
                let _ = tx
                    .lock()
                    .unwrap()
                    .send(serde_json::from_str(&json).unwrap());
            }
            Ok(())
        });
        (channel, rx)
    }

    fn wait_finished(rx: &mpsc::Receiver<serde_json::Value>) -> Vec<serde_json::Value> {
        let mut events = Vec::new();
        loop {
            let e = rx
                .recv_timeout(Duration::from_secs(30))
                .expect("rsync did not finish");
            let done = e["event"] == "finished";
            events.push(e);
            if done {
                return events;
            }
        }
    }

    fn rsync_available() -> bool {
        Command::new("rsync").arg("--version").output().is_ok()
    }

    fn temp_dir(name: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("grysync-test-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn runs_rsync_and_streams_events() {
        if !rsync_available() {
            eprintln!("rsync not installed, skipping");
            return;
        }
        let root = temp_dir("run");
        let src = root.join("src");
        std::fs::create_dir_all(src.join("sub")).unwrap();
        std::fs::write(src.join("a.txt"), vec![b'a'; 200_000]).unwrap();
        std::fs::write(src.join("sub/b.txt"), "hello").unwrap();

        let runner = Arc::new(Runner::default());
        let (ch, rx) = channel();
        let args = vec![
            "-a".into(),
            "-i".into(),
            "--info=progress2".into(),
            format!("{}/", src.display()),
            root.join("dst").display().to_string(),
        ];
        runner.start("rsync", args, ch).unwrap();
        let events = wait_finished(&rx);

        assert_eq!(events[0]["event"], "started");
        assert!(events.iter().any(|e| e["event"] == "progress"));
        assert!(events
            .iter()
            .any(|e| e["event"] == "line"
                && e["data"]["text"].as_str().unwrap().ends_with("sub/b.txt")));
        let last = events.last().unwrap();
        assert_eq!(last["data"]["code"], 0);
        assert_eq!(last["data"]["success"], true);
        assert_eq!(
            std::fs::read_to_string(root.join("dst/sub/b.txt")).unwrap(),
            "hello"
        );
        assert!(runner.runs.lock().unwrap().is_empty());
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn reports_errors_and_exit_code() {
        if !rsync_available() {
            return;
        }
        let runner = Arc::new(Runner::default());
        let (ch, rx) = channel();
        runner
            .start("rsync", vec!["--definitely-not-an-option".into()], ch)
            .unwrap();
        let events = wait_finished(&rx);
        assert!(events
            .iter()
            .any(|e| e["event"] == "line" && e["data"]["stream"] == "err"));
        assert_eq!(events.last().unwrap()["data"]["code"], 1);
    }

    #[test]
    fn missing_program_is_an_error() {
        let runner = Arc::new(Runner::default());
        let (ch, _rx) = channel();
        assert!(runner.start("grysync-no-such-program", vec![], ch).is_err());
    }

    #[cfg(unix)]
    #[test]
    fn cancel_stops_the_run() {
        if !rsync_available() {
            return;
        }
        let root = temp_dir("cancel");
        let runner = Arc::new(Runner::default());
        let (ch, rx) = channel();
        // Throttled copy of a large sparse file takes long enough to cancel.
        let f = std::fs::File::create(root.join("big")).unwrap();
        f.set_len(200 * 1024 * 1024).unwrap();
        let args = vec![
            "--bwlimit=100".into(),
            root.join("big").display().to_string(),
            root.join("copy").display().to_string(),
        ];
        let id = runner.start("rsync", args, ch).unwrap();
        thread::sleep(Duration::from_millis(500));
        runner.cancel(id).unwrap();
        let events = wait_finished(&rx);
        let last = &events.last().unwrap()["data"];
        assert_eq!(last["cancelled"], true);
        assert_eq!(last["success"], false);
        assert!(runner.cancel(id).is_err());
        let _ = std::fs::remove_dir_all(root);
    }
}
