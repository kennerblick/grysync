// Catalogue of every rsync command-line option (rsync 3.4 man page).
//
// Options that are handled by dedicated UI (source/destination, the filter
// rule editor, SSH settings) are still listed here so they can be found via
// search, but the remote-shell and filter-rule values are merged in args.ts.

export type Kind = "flag" | "count" | "text" | "number" | "path" | "select" | "list";

export type CategoryId =
  | "essentials"
  | "files"
  | "links"
  | "meta"
  | "compare"
  | "delete"
  | "backup"
  | "transfer"
  | "perf"
  | "filters"
  | "remote"
  | "output"
  | "advanced";

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  blurb: string;
}

export interface RsyncOption {
  /** Long option without the leading dashes; also the key in a profile. */
  id: string;
  short?: string;
  kind: Kind;
  label: string;
  help: string;
  category: CategoryId;
  choices?: { value: string; label: string }[];
  placeholder?: string;
  /** Minimum rsync version that knows this option. */
  since?: string;
  /** For `path`: whether the picker should select a directory or a file. */
  pick?: "dir" | "file";
  /** Shown with a warning colour: may delete or overwrite data. */
  danger?: boolean;
  /** Other option ids this one switches on (informational). */
  implies?: string[];
  /** The option has no long form; emit `-<short>` instead of `--<id>`. */
  shortOnly?: boolean;
}

export const categories: Category[] = [
  { id: "essentials", label: "Essentials", icon: "★", blurb: "The options almost every sync needs." },
  { id: "files", label: "Files & folders", icon: "▤", blurb: "What gets copied and how directories are treated." },
  { id: "links", label: "Links", icon: "⛓", blurb: "Symbolic and hard links." },
  { id: "meta", label: "Permissions & metadata", icon: "⚿", blurb: "Owners, modes, timestamps, ACLs and xattrs." },
  { id: "compare", label: "Compare & skip", icon: "⇆", blurb: "How rsync decides that a file needs updating." },
  { id: "delete", label: "Deletion", icon: "✕", blurb: "Removing files on the receiving side." },
  { id: "backup", label: "Backups & snapshots", icon: "⟲", blurb: "Keep old versions and build incremental snapshots." },
  { id: "transfer", label: "Transfer", icon: "⇥", blurb: "Partial files, temp files and in-place updates." },
  { id: "perf", label: "Speed & compression", icon: "⚡", blurb: "Compression, bandwidth and checksum algorithms." },
  { id: "filters", label: "Filter files", icon: "⧩", blurb: "Include/exclude lists and file lists." },
  { id: "remote", label: "Remote & network", icon: "☁", blurb: "SSH, daemon connections and networking." },
  { id: "output", label: "Output & logging", icon: "☰", blurb: "What rsync reports while it runs." },
  { id: "advanced", label: "Advanced", icon: "⚙", blurb: "Batch mode, protocol tweaks and time limits." },
];

const infoFlags =
  "BACKUP, COPY, DEL, FLIST, MISC, MOUNT, NAME, NONREG, PROGRESS, REMOVE, SKIP, STATS, SYMSAFE (append a level, e.g. NAME2)";
const debugFlags =
  "ACL, BACKUP, BIND, CHDIR, CONNECT, CMD, DEL, DELTASUM, DUP, EXIT, FILTER, FLIST, FUZZY, GENR, HASH, HLINK, ICONV, IO, NSTR, OWN, PROTO, RECV, SEND, TIME";

export const options: RsyncOption[] = [
  // ── Essentials ────────────────────────────────────────────────────────
  {
    id: "archive", short: "a", kind: "flag", category: "essentials",
    label: "Archive mode",
    help: "Recurse and preserve almost everything: symlinks, permissions, times, group, owner and devices. Same as -rlptgoD (no -A, -X, -U, -N, -H).",
    implies: ["recursive", "links", "perms", "times", "group", "owner", "devices", "specials"],
  },
  { id: "verbose", short: "v", kind: "count", category: "essentials", label: "Verbose", help: "Increase verbosity. Each level adds more detail (-v, -vv, -vvv…)." },
  { id: "dry-run", short: "n", kind: "flag", category: "essentials", label: "Dry run", help: "Show what would be transferred without changing anything. Combine with itemize or verbose." },
  { id: "human-readable", short: "h", kind: "count", category: "essentials", label: "Human-readable numbers", help: "Print numbers in a human-readable format. Level 2 uses powers of 1024." },
  { id: "compress", short: "z", kind: "flag", category: "essentials", label: "Compress", help: "Compress file data during the transfer. Useful over slow networks, wasteful on local copies." },
  { id: "delete", kind: "flag", category: "essentials", danger: true, label: "Delete extraneous files", help: "Delete files on the receiver that do not exist on the sender (mirror). Always try a dry run first." },
  { id: "progress", kind: "flag", category: "essentials", label: "Per-file progress", help: "Show progress for each file. grysync shows overall progress automatically." },
  { id: "partial", kind: "flag", category: "essentials", label: "Keep partial files", help: "Keep partially transferred files so an interrupted transfer can resume faster." },
  { id: "stats", kind: "flag", category: "essentials", label: "Statistics", help: "Print a summary of the transfer at the end." },
  { id: "itemize-changes", short: "i", kind: "count", category: "essentials", label: "Itemize changes", help: "Print a change summary for every updated file (e.g. >f.st......). Level 2 also lists unchanged files." },

  // ── Files & folders ───────────────────────────────────────────────────
  { id: "recursive", short: "r", kind: "flag", category: "files", label: "Recursive", help: "Copy directories recursively." },
  { id: "dirs", short: "d", kind: "flag", category: "files", label: "Transfer directories without recursing", help: "Copy directories themselves but not their contents (unless the name ends in /. or a trailing slash is used)." },
  { id: "old-dirs", kind: "flag", category: "files", label: "Old --dirs behaviour", help: "Like --dirs, but works with older rsync versions on the remote side (uses --no-r trick)." },
  { id: "relative", short: "R", kind: "flag", category: "files", label: "Relative path names", help: "Send full path names; use /./ in the source to mark where the relative part starts." },
  { id: "no-implied-dirs", kind: "flag", category: "files", label: "No implied directories", help: "With --relative, do not send the implied parent directories." },
  { id: "mkpath", kind: "flag", category: "files", since: "3.2.3", label: "Create destination path", help: "Create all missing path components of the destination." },
  { id: "one-file-system", short: "x", kind: "count", category: "files", label: "Stay on one file system", help: "Do not cross file-system boundaries when recursing. Level 2 also skips mount-point directories." },
  { id: "prune-empty-dirs", short: "m", kind: "flag", category: "files", label: "Prune empty directories", help: "Remove empty directory chains from the file list." },
  { id: "existing", kind: "flag", category: "files", label: "Only update existing files", help: "Skip creating new files on the receiver (alias --ignore-non-existing)." },
  { id: "ignore-existing", kind: "flag", category: "files", label: "Skip existing files", help: "Skip updating files that already exist on the receiver." },
  { id: "remove-source-files", kind: "flag", category: "files", danger: true, label: "Remove source files (move)", help: "Delete files from the sender after they were transferred successfully. Directories are kept." },
  { id: "max-size", kind: "text", category: "files", placeholder: "e.g. 500M", label: "Maximum file size", help: "Do not transfer files larger than SIZE (K, M, G suffixes; add +1/-1 for exact limits)." },
  { id: "min-size", kind: "text", category: "files", placeholder: "e.g. 10K", label: "Minimum file size", help: "Do not transfer files smaller than SIZE." },
  { id: "sparse", short: "S", kind: "flag", category: "files", label: "Sparse files", help: "Turn sequences of zeros into holes on the receiver." },
  { id: "preallocate", kind: "flag", category: "files", label: "Preallocate", help: "Allocate the destination file before writing data to it (reduces fragmentation)." },
  { id: "copy-devices", kind: "flag", category: "files", label: "Copy device contents", help: "Copy the content of device files as if they were regular files." },
  { id: "write-devices", kind: "flag", category: "files", since: "3.2.0", danger: true, label: "Write to devices", help: "Write data into existing device files on the receiver instead of replacing them." },

  // ── Links ─────────────────────────────────────────────────────────────
  { id: "links", short: "l", kind: "flag", category: "links", label: "Copy symlinks as symlinks", help: "Recreate symbolic links on the receiver." },
  { id: "copy-links", short: "L", kind: "flag", category: "links", label: "Follow symlinks", help: "Transform symlinks into the files or directories they point to." },
  { id: "copy-unsafe-links", kind: "flag", category: "links", label: "Follow unsafe symlinks", help: "Only follow symlinks that point outside the transferred tree." },
  { id: "safe-links", kind: "flag", category: "links", label: "Ignore unsafe symlinks", help: "Skip symlinks that point outside the transferred tree." },
  { id: "munge-links", kind: "flag", category: "links", label: "Munge symlinks", help: "Store symlinks in a form that makes them unusable (for untrusted data)." },
  { id: "copy-dirlinks", short: "k", kind: "flag", category: "links", label: "Follow symlinks to directories", help: "Transform symlinks to directories into real directories." },
  { id: "keep-dirlinks", short: "K", kind: "flag", category: "links", label: "Keep receiver's directory symlinks", help: "Treat symlinked directories on the receiver as real directories." },
  { id: "hard-links", short: "H", kind: "flag", category: "links", label: "Preserve hard links", help: "Find and recreate hard-linked files. Costs memory on large trees." },

  // ── Permissions & metadata ────────────────────────────────────────────
  { id: "perms", short: "p", kind: "flag", category: "meta", label: "Preserve permissions", help: "Set destination permissions to match the source." },
  { id: "executability", short: "E", kind: "flag", category: "meta", label: "Preserve executability", help: "Only preserve the executable bit (when --perms is off)." },
  { id: "chmod", kind: "list", category: "meta", placeholder: "e.g. Du=rwx,Dgo=rx,Fu=rw,Fgo=r", label: "Change permissions", help: "Apply chmod-style changes to transferred files. D = directories, F = files." },
  { id: "acls", short: "A", kind: "flag", category: "meta", label: "Preserve ACLs", help: "Preserve access control lists (implies --perms)." },
  { id: "xattrs", short: "X", kind: "count", category: "meta", label: "Preserve extended attributes", help: "Preserve extended attributes. Level 2 also copies system xattrs when run as root." },
  { id: "owner", short: "o", kind: "flag", category: "meta", label: "Preserve owner", help: "Preserve the file owner (requires super-user on the receiver)." },
  { id: "group", short: "g", kind: "flag", category: "meta", label: "Preserve group", help: "Preserve the file group." },
  { id: "devices", kind: "flag", category: "meta", label: "Preserve device files", help: "Recreate character and block device files (requires super-user)." },
  { id: "specials", kind: "flag", category: "meta", label: "Preserve special files", help: "Recreate named sockets and FIFOs." },
  { id: "times", short: "t", kind: "flag", category: "meta", label: "Preserve modification times", help: "Keep modification times. Without it every file is re-checked on the next run." },
  { id: "atimes", short: "U", kind: "flag", category: "meta", since: "3.2.0", label: "Preserve access times", help: "Preserve access times." },
  { id: "open-noatime", kind: "flag", category: "meta", since: "3.2.0", label: "Don't touch access times", help: "Open files with O_NOATIME so reading does not change their access times." },
  { id: "crtimes", short: "N", kind: "flag", category: "meta", since: "3.2.0", label: "Preserve creation times", help: "Preserve file creation times (where supported)." },
  { id: "omit-dir-times", short: "O", kind: "flag", category: "meta", label: "Omit directory times", help: "Do not preserve modification times on directories." },
  { id: "omit-link-times", short: "J", kind: "flag", category: "meta", label: "Omit symlink times", help: "Do not preserve modification times on symlinks." },
  { id: "super", kind: "flag", category: "meta", label: "Receiver runs as super-user", help: "Attempt super-user activities even when not root." },
  { id: "fake-super", kind: "flag", category: "meta", label: "Fake super-user", help: "Store privileged attributes in xattrs instead of applying them." },
  { id: "numeric-ids", kind: "flag", category: "meta", label: "Numeric user/group IDs", help: "Transfer numeric IDs instead of mapping user and group names." },
  { id: "usermap", kind: "text", category: "meta", placeholder: "e.g. alice:bob,*:nobody", label: "User mapping", help: "Map user names or IDs on the receiver (FROM:TO,…)." },
  { id: "groupmap", kind: "text", category: "meta", placeholder: "e.g. staff:users", label: "Group mapping", help: "Map group names or IDs on the receiver (FROM:TO,…)." },
  { id: "chown", kind: "text", category: "meta", placeholder: "user:group", label: "Change owner", help: "Set the owner and/or group of all files (USER:GROUP)." },
  { id: "copy-as", kind: "text", category: "meta", since: "3.2.0", placeholder: "user[:group]", label: "Copy as user", help: "Run the copy on the receiver as the given user (requires root)." },
  { id: "iconv", kind: "text", category: "meta", placeholder: "e.g. utf-8,iso-8859-1", label: "Convert file-name charset", help: "Convert file names between character sets (LOCAL,REMOTE or '.' for the locale)." },

  // ── Compare & skip ────────────────────────────────────────────────────
  { id: "checksum", short: "c", kind: "flag", category: "compare", label: "Compare by checksum", help: "Decide what to update by checksum instead of modification time and size. Slow but thorough." },
  { id: "update", short: "u", kind: "flag", category: "compare", label: "Skip newer files on receiver", help: "Do not overwrite files that are newer on the receiver." },
  { id: "ignore-times", short: "I", kind: "flag", category: "compare", label: "Ignore times", help: "Transfer files even if size and time match." },
  { id: "size-only", kind: "flag", category: "compare", label: "Compare size only", help: "Skip files whose size matches, ignoring modification times." },
  { id: "modify-window", short: "@", kind: "number", category: "compare", placeholder: "seconds", label: "Time tolerance", help: "Treat modification times as equal if they differ by at most this many seconds (use 1 for FAT)." },
  { id: "fuzzy", short: "y", kind: "count", category: "compare", label: "Fuzzy basis files", help: "Look for a similar file to use as basis when the destination is missing. Level 2 also searches compare-dest dirs." },
  { id: "checksum-choice", kind: "select", category: "compare", since: "3.2.0", label: "Checksum algorithm",
    help: "Choose the checksum algorithm used for transfer and --checksum.",
    choices: [
      { value: "auto", label: "auto" }, { value: "xxh128", label: "xxh128" }, { value: "xxh3", label: "xxh3" },
      { value: "xxh64", label: "xxh64" }, { value: "md5", label: "md5" }, { value: "md4", label: "md4" },
      { value: "sha1", label: "sha1" }, { value: "none", label: "none" },
    ] },
  { id: "checksum-seed", kind: "number", category: "compare", placeholder: "number", label: "Checksum seed", help: "Set the block/file checksum seed (for reproducible batch files)." },
  { id: "ignore-missing-args", kind: "flag", category: "compare", label: "Ignore missing source arguments", help: "Silently skip source arguments that do not exist." },
  { id: "delete-missing-args", kind: "flag", category: "compare", danger: true, label: "Delete missing source arguments", help: "Delete the destination counterpart of source arguments that do not exist." },

  // ── Deletion ──────────────────────────────────────────────────────────
  { id: "delete-before", kind: "flag", category: "delete", danger: true, label: "Delete before transfer", help: "Delete extraneous files before transferring (implies --delete)." },
  { id: "delete-during", kind: "flag", category: "delete", danger: true, label: "Delete during transfer", help: "Delete extraneous files incrementally while transferring (alias --del)." },
  { id: "delete-delay", kind: "flag", category: "delete", danger: true, label: "Delete after, found during", help: "Find deletions during the transfer and delete afterwards." },
  { id: "delete-after", kind: "flag", category: "delete", danger: true, label: "Delete after transfer", help: "Delete extraneous files after the transfer is done." },
  { id: "delete-excluded", kind: "flag", category: "delete", danger: true, label: "Delete excluded files", help: "Also delete files on the receiver that are excluded by filter rules." },
  { id: "ignore-errors", kind: "flag", category: "delete", danger: true, label: "Delete even on I/O errors", help: "Delete even when there were I/O errors on the sender." },
  { id: "force", kind: "flag", category: "delete", danger: true, label: "Force directory deletion", help: "Delete a non-empty directory when it is replaced by a non-directory." },
  { id: "max-delete", kind: "number", category: "delete", placeholder: "e.g. 100", label: "Maximum deletions", help: "Do not delete more than this many files (a safety net for mirrors)." },

  // ── Backups & snapshots ───────────────────────────────────────────────
  { id: "backup", short: "b", kind: "flag", category: "backup", label: "Make backups", help: "Rename files that would be replaced or deleted instead of losing them." },
  { id: "backup-dir", kind: "path", pick: "dir", category: "backup", placeholder: "/path/to/backups", label: "Backup directory", help: "Store backups in this directory (implies --backup)." },
  { id: "suffix", kind: "text", category: "backup", placeholder: "~", label: "Backup suffix", help: "Suffix for backup files (default ~ without --backup-dir)." },
  { id: "link-dest", kind: "list", category: "backup", placeholder: "/path/to/previous/snapshot", label: "Hard-link to directory", help: "Hard-link unchanged files to this directory — the classic way to build incremental snapshots. Up to 20 dirs." },
  { id: "compare-dest", kind: "list", category: "backup", placeholder: "/path/to/compare", label: "Compare against directory", help: "Skip files that are identical in this directory." },
  { id: "copy-dest", kind: "list", category: "backup", placeholder: "/path/to/copy/from", label: "Copy from directory", help: "Like compare-dest, but copies unchanged files locally from this directory." },

  // ── Transfer ──────────────────────────────────────────────────────────
  { id: "partial-dir", kind: "text", category: "transfer", placeholder: ".rsync-partial", label: "Partial-file directory", help: "Keep partially transferred files in this directory (implies --partial)." },
  { id: "delay-updates", kind: "flag", category: "transfer", label: "Delay updates", help: "Put all updated files into place at the end, for a more atomic update." },
  { id: "inplace", kind: "flag", category: "transfer", danger: true, label: "Update files in place", help: "Write updates directly into destination files. Faster for large files, but a failed transfer leaves them inconsistent." },
  { id: "append", kind: "flag", category: "transfer", label: "Append data", help: "Append data onto shorter files, assuming the existing part is identical." },
  { id: "append-verify", kind: "flag", category: "transfer", label: "Append and verify", help: "Like --append, but verify the whole file with a checksum." },
  { id: "whole-file", short: "W", kind: "flag", category: "transfer", label: "Copy whole files", help: "Disable the delta-transfer algorithm (default for local copies)." },
  { id: "temp-dir", short: "T", kind: "path", pick: "dir", category: "transfer", placeholder: "/tmp", label: "Temporary directory", help: "Create temporary files in this directory on the receiver." },
  { id: "fsync", kind: "flag", category: "transfer", since: "3.2.4", label: "fsync every file", help: "Flush every written file to disk before continuing." },
  { id: "block-size", short: "B", kind: "text", category: "transfer", placeholder: "e.g. 128K", label: "Block size", help: "Force a fixed checksum block size for the delta algorithm." },

  // ── Speed & compression ───────────────────────────────────────────────
  { id: "compress-choice", kind: "select", category: "perf", since: "3.2.0", label: "Compression algorithm",
    help: "Choose the compression algorithm. Enable Compress as well.",
    choices: [
      { value: "auto", label: "auto" }, { value: "zstd", label: "zstd" }, { value: "lz4", label: "lz4" },
      { value: "zlibx", label: "zlibx" }, { value: "zlib", label: "zlib" }, { value: "none", label: "none" },
    ] },
  { id: "compress-level", kind: "number", category: "perf", placeholder: "e.g. 3", label: "Compression level", help: "Compression level. Range depends on the algorithm (zstd: -131072…22)." },
  { id: "skip-compress", kind: "text", category: "perf", placeholder: "gz/jpg/mp4/zip", label: "Don't compress suffixes", help: "Slash-separated list of file suffixes that are not compressed." },
  { id: "bwlimit", kind: "text", category: "perf", placeholder: "e.g. 5M", label: "Bandwidth limit", help: "Limit the socket I/O bandwidth (KiB/s by default; suffixes allowed)." },
  { id: "max-alloc", kind: "text", category: "perf", since: "3.2.2", placeholder: "e.g. 4G", label: "Memory allocation limit", help: "Change the per-allocation memory limit." },

  // ── Filters ───────────────────────────────────────────────────────────
  { id: "cvs-exclude", short: "C", kind: "flag", category: "filters", label: "CVS-style excludes", help: "Ignore files in the same way CVS does (.git is not included; use a rule for that)." },
  { id: "exclude-from", kind: "path", pick: "file", category: "filters", placeholder: "/path/to/excludes.txt", label: "Exclude patterns from file", help: "Read exclude patterns from a file." },
  { id: "include-from", kind: "path", pick: "file", category: "filters", placeholder: "/path/to/includes.txt", label: "Include patterns from file", help: "Read include patterns from a file." },
  { id: "files-from", kind: "path", pick: "file", category: "filters", placeholder: "/path/to/filelist.txt", label: "Read file list from file", help: "Transfer exactly the files listed in this file (relative to the source)." },
  { id: "from0", short: "0", kind: "flag", category: "filters", label: "Null-separated lists", help: "Files read by *-from options are separated by NUL characters." },
  { id: "filter-merge-dir", short: "F", shortOnly: true, kind: "count", category: "filters", label: "Per-directory .rsync-filter", help: "-F reads .rsync-filter files in each directory; -FF also excludes those files from the transfer." },

  // ── Remote & network ──────────────────────────────────────────────────
  { id: "rsh", short: "e", kind: "text", category: "remote", placeholder: "ssh -p 2222", label: "Remote shell", help: "Remote shell command. Overrides the SSH settings of source/destination." },
  { id: "rsync-path", kind: "text", category: "remote", placeholder: "sudo rsync", label: "Remote rsync path", help: "Program to run on the remote side, e.g. a custom path or `sudo rsync`." },
  { id: "remote-option", short: "M", kind: "list", category: "remote", placeholder: "--log-file=/tmp/remote.log", label: "Remote-only option", help: "Send an option only to the remote side." },
  { id: "secluded-args", short: "s", kind: "flag", category: "remote", since: "3.2.4", label: "Secluded arguments", help: "Send file names via the protocol instead of the remote shell command line (formerly --protect-args)." },
  { id: "old-args", kind: "flag", category: "remote", since: "3.2.4", label: "Old argument splitting", help: "Restore the pre-3.2.4 remote argument splitting behaviour." },
  { id: "trust-sender", kind: "flag", category: "remote", since: "3.2.5", label: "Trust the sender", help: "Disable extra safety checks on the file list received from the sender." },
  { id: "timeout", kind: "number", category: "remote", placeholder: "seconds", label: "I/O timeout", help: "Abort when no data is transferred for this many seconds." },
  { id: "contimeout", kind: "number", category: "remote", placeholder: "seconds", label: "Connection timeout", help: "Timeout for connecting to an rsync daemon." },
  { id: "address", kind: "text", category: "remote", placeholder: "0.0.0.0", label: "Bind address", help: "Bind outgoing sockets to this address." },
  { id: "port", kind: "number", category: "remote", placeholder: "873", label: "Daemon port", help: "Use an alternate rsync daemon port." },
  { id: "sockopts", kind: "text", category: "remote", placeholder: "SO_SNDBUF=65536", label: "Socket options", help: "Custom TCP socket options." },
  { id: "blocking-io", kind: "flag", category: "remote", label: "Blocking I/O", help: "Use blocking I/O for the remote shell." },
  { id: "password-file", kind: "path", pick: "file", category: "remote", placeholder: "/path/to/password", label: "Daemon password file", help: "Read the daemon password from a file." },
  { id: "early-input", kind: "path", pick: "file", category: "remote", since: "3.2.1", placeholder: "/path/to/file", label: "Early input file", help: "Send up to 5K of data to the daemon's early exec script." },
  { id: "no-motd", kind: "flag", category: "remote", label: "Suppress daemon MOTD", help: "Do not print the daemon's message of the day." },
  { id: "ipv4", short: "4", kind: "flag", category: "remote", label: "Prefer IPv4", help: "Use IPv4." },
  { id: "ipv6", short: "6", kind: "flag", category: "remote", label: "Prefer IPv6", help: "Use IPv6." },

  // ── Output & logging ──────────────────────────────────────────────────
  { id: "quiet", short: "q", kind: "flag", category: "output", label: "Quiet", help: "Suppress non-error messages." },
  { id: "info", kind: "text", category: "output", since: "3.1.0", placeholder: "e.g. NAME,STATS2", label: "Info flags", help: `Fine-grained informational output: ${infoFlags}.` },
  { id: "debug", kind: "text", category: "output", since: "3.1.0", placeholder: "e.g. FILTER2", label: "Debug flags", help: `Fine-grained debug output: ${debugFlags}.` },
  { id: "stderr", kind: "select", category: "output", since: "3.2.4", label: "stderr mode",
    help: "Where rsync sends errors: e = errors only, a = all messages, c = client decides.",
    choices: [{ value: "errors", label: "errors" }, { value: "all", label: "all" }, { value: "client", label: "client" }] },
  { id: "out-format", kind: "text", category: "output", placeholder: "%i %n%L", label: "Output format", help: "Format of per-file output lines (see log format in rsyncd.conf)." },
  { id: "log-file", kind: "path", pick: "file", category: "output", placeholder: "/path/to/rsync.log", label: "Log file", help: "Write what rsync is doing to a log file." },
  { id: "log-file-format", kind: "text", category: "output", placeholder: "%i %n%L", label: "Log file format", help: "Format of the log-file lines." },
  { id: "8-bit-output", short: "8", kind: "flag", category: "output", label: "8-bit output", help: "Leave high-bit characters unescaped in the output." },
  { id: "list-only", kind: "flag", category: "output", label: "List only", help: "List the source files instead of copying them." },
  { id: "outbuf", kind: "select", category: "output", label: "Output buffering",
    help: "Output buffering: None, Line or Block.",
    choices: [{ value: "N", label: "None" }, { value: "L", label: "Line" }, { value: "B", label: "Block" }] },

  // ── Advanced ──────────────────────────────────────────────────────────
  { id: "stop-after", kind: "number", category: "advanced", since: "3.2.3", placeholder: "minutes", label: "Stop after", help: "Stop copying after this many minutes (alias --time-limit)." },
  { id: "stop-at", kind: "text", category: "advanced", since: "3.2.3", placeholder: "2026-12-31T23:59", label: "Stop at", help: "Stop copying when this point in time is reached (y-m-dTh:m)." },
  { id: "write-batch", kind: "path", pick: "file", category: "advanced", placeholder: "/path/to/batch", label: "Write batch file", help: "Record the transfer as a batch file for later replay." },
  { id: "only-write-batch", kind: "path", pick: "file", category: "advanced", placeholder: "/path/to/batch", label: "Only write batch file", help: "Like --write-batch, but do not update the destination." },
  { id: "read-batch", kind: "path", pick: "file", category: "advanced", placeholder: "/path/to/batch", label: "Read batch file", help: "Apply a batch file previously written with --write-batch." },
  { id: "protocol", kind: "number", category: "advanced", placeholder: "e.g. 30", label: "Force protocol version", help: "Force an older protocol version (for talking to old rsync)." },
  { id: "no-inc-recursive", kind: "flag", category: "advanced", label: "Disable incremental recursion", help: "Build the whole file list first. Gives exact totals in the progress bar at the cost of a slower start." },
];

export const optionById: Map<string, RsyncOption> = new Map(options.map((o) => [o.id, o]));

/** Compares dotted version strings: returns <0, 0 or >0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** `texts` are the option's label and help in every UI language. */
export function matchesSearch(o: RsyncOption, query: string, texts: string[] = [o.label, o.help]): boolean {
  const q = query.trim().toLowerCase().replace(/^-+/, "");
  if (!q) return true;
  return o.id.includes(q) || o.short === q || texts.some((s) => s.toLowerCase().includes(q));
}
