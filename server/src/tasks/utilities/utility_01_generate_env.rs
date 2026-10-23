use base64::{Engine as _, engine::general_purpose::STANDARD};
use rand::RngCore;
use salvo::async_trait;
use sea_orm::DatabaseConnection;
use std::collections::HashSet;
use std::fs;
use std::io::Write;
use std::path::Path;

use crate::config::jwt;
use crate::tasks::Task;

pub struct GenerateEnvTask;

pub const NAME: &str = "utility:generate-env";

/// Keys that only count as present when set (not commented out): without them the
/// server falls back to an insecure default, so a commented-out line gets a real one added.
const MUST_BE_SET: &[&str] = &["JWT_SECRET"];

/// Shorter JWT secrets are easy to brute-force (HS256 wants at least 256 bits).
const MIN_JWT_SECRET_LEN: usize = 32;

enum Value {
    Literal(&'static str),
    /// Random bytes, hex encoded (`openssl rand -hex N`)
    Hex(usize),
    /// Random bytes, base64 encoded (`openssl rand -base64 N`)
    Base64(usize),
    /// Absolute path of the directory the task runs in
    CurrentDir,
}

struct Entry {
    key: &'static str,
    value: Value,
    /// Written commented out: the server has a default, or the database preference wins
    optional: bool,
}

const fn required(key: &'static str, value: Value) -> Entry {
    Entry { key, value, optional: false }
}

const fn optional(key: &'static str, value: Value) -> Entry {
    Entry { key, value, optional: true }
}

/// Every key the server reads, grouped as written to `.env`.
const SECTIONS: &[(&str, &[Entry])] = &[
    ("Server", &[
        required("SERVER_DOMAIN", Value::Literal("localhost:5800")),
        // Relative paths (logos, QR images) resolve against the working directory without it
        optional("APP_DIRECTORY", Value::CurrentDir),
        required("APP_FRONTEND_URL", Value::Literal("http://localhost:3000")),
        optional("APP_SYSTEM_NAME", Value::Literal("Sistem Informasi Akademik")),
        optional("INSTITUTION_NAME", Value::Literal("")),
        optional("INSTITUTION_ADDRESS", Value::Literal("")),
    ]),
    ("Database", &[
        required("DATABASE_URL", Value::Literal("postgres://CHANGE_ME:CHANGE_ME@127.0.0.1:5432/xsia_xarx")),
        required("DB_CONNECT_TIMEOUT", Value::Literal("8000")),
        required("DB_IDLE_TIMEOUT", Value::Literal("8000")),
        required("DB_MIN_CONNECTIONS", Value::Literal("5")),
        required("DB_MAX_CONNECTIONS", Value::Literal("50")),
    ]),
    ("Auth & encryption (generated; never change APP_ENCRYPTION_KEY once secrets are stored)", &[
        required("JWT_SECRET", Value::Base64(64)),
        required("JWT_EXPIRATION_HOURS", Value::Literal("24")),
        required("APP_ENCRYPTION_KEY", Value::Base64(32)),
    ]),
    ("Inbound webhooks (generated; the active preference.what_apps record wins when set)", &[
        required("MIAB_WEBHOOK_SECRET", Value::Hex(32)),
        required("OPENWA_WEBHOOK_SECRET", Value::Hex(32)),
    ]),
    ("SMTP fallback (used only without an active mail server; see utility:preference-add-mail-server)", &[
        optional("SMTP_HOST", Value::Literal("localhost")),
        optional("SMTP_PORT", Value::Literal("587")),
        optional("SMTP_USER", Value::Literal("")),
        optional("SMTP_PASSWORD", Value::Literal("")),
        optional("SMTP_FROM_EMAIL", Value::Literal("noreply@example.ac.id")),
        optional("SMTP_FROM_NAME", Value::Literal("Xsia Xarx")),
    ]),
    ("OpenWA fallback (used only without active settings; see utility:preference-add-openwa)", &[
        optional("OPENWA_URL", Value::Literal("http://localhost:2785")),
        optional("OPENWA_API_KEY_SESSION_ID", Value::Literal("")),
        optional("OPENWA_API_KEY_OPERATOR", Value::Literal("")),
    ]),
    ("PDDikti Feeder fallback (used only without a stored credential; see utility:feeder-add-credential)", &[
        optional("FEEDER_URL", Value::Literal("http://feeder.example.ac.id/ws/live2.php")),
        optional("FEEDER_USERNAME", Value::Literal("")),
        optional("FEEDER_PASSWORD", Value::Literal("")),
    ]),
    ("External tools (defaults shown)", &[
        optional("CHROME_BIN", Value::Literal("/usr/lib64/chromium-browser/headless_shell")),
        optional("DOCLING_BIN", Value::Literal("docling")),
        optional("EMBEDDING_MODEL_DIR", Value::Literal("models/paraphrase-multilingual-MiniLM-L12-v2")),
        optional("AI_UPLOAD_DIR", Value::Literal("storage/ai/uploads")),
        optional("LLM_MODEL_PATH", Value::Literal("models/qwen2.5-1.5b-instruct-q4_k_m.gguf")),
        optional("LLM_TOKENIZER_DIR", Value::Literal("models/qwen2.5-1.5b-instruct")),
        // Makes the CPU language model read long prompts about 5x faster for about 6 GB more RAM (answers get slower)
        optional("CANDLE_DEQUANTIZE_ALL", Value::Literal("1")),
        optional("DOCLING_NUM_THREADS", Value::Literal("8")),
    ]),
];

fn random_bytes(len: usize) -> Vec<u8> {
    let mut bytes = vec![0u8; len];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes
}

fn render_value(value: &Value) -> std::io::Result<String> {
    Ok(match value {
        Value::Literal(v) => v.to_string(),
        Value::Hex(len) => random_bytes(*len).iter().map(|b| format!("{b:02x}")).collect(),
        Value::Base64(len) => STANDARD.encode(random_bytes(*len)),
        Value::CurrentDir => std::env::current_dir()?.display().to_string(),
    })
}

fn render_entry(entry: &Entry) -> std::io::Result<String> {
    let prefix = if entry.optional { "# " } else { "" };
    Ok(format!("{prefix}{}=\"{}\"\n", entry.key, render_value(&entry.value)?))
}

/// A `KEY=value` line of a `.env` file.
struct EnvLine {
    key: String,
    value: String,
    commented: bool,
}

fn parse_lines(content: &str) -> Vec<EnvLine> {
    content
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim_start();
            let commented = trimmed.starts_with('#');
            let line = trimmed.trim_start_matches('#').trim_start();
            let line = line.strip_prefix("export ").unwrap_or(line);
            let (key, value) = line.split_once('=')?;
            let key = key.trim();
            let valid = !key.is_empty()
                && key.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '_');
            let value = value.trim().trim_matches(|c| c == '"' || c == '\'').to_string();
            valid.then(|| EnvLine { key: key.to_string(), value, commented })
        })
        .collect()
}

/// Keys already present in an existing `.env`, including commented-out ones,
/// so a key the user disabled on purpose is not added again. Keys in
/// [`MUST_BE_SET`] count only when set.
fn existing_keys(content: &str) -> HashSet<String> {
    parse_lines(content)
        .into_iter()
        .filter(|line| !line.commented || !MUST_BE_SET.contains(&line.key.as_str()))
        .map(|line| line.key)
        .collect()
}

/// Describes what is wrong with the `JWT_SECRET` already set in `content`, if anything.
/// `None` also when it isn't set at all, since then a generated one is added.
fn jwt_secret_problem(content: &str) -> Option<String> {
    // dotenv uses the first occurrence of a key
    let secret = parse_lines(content)
        .into_iter()
        .find(|line| !line.commented && line.key == "JWT_SECRET")?
        .value;
    if secret.is_empty() {
        Some("JWT_SECRET is empty".to_string())
    } else if secret == jwt::DEFAULT_SECRET {
        Some("JWT_SECRET is the public built-in default".to_string())
    } else if secret.len() < MIN_JWT_SECRET_LEN {
        Some(format!("JWT_SECRET is only {} characters (use at least {MIN_JWT_SECRET_LEN})", secret.len()))
    } else {
        None
    }
}

/// Renders the sections, leaving out keys in `skip`. Returns the text and the keys written.
fn render(skip: &HashSet<String>) -> std::io::Result<(String, Vec<&'static str>)> {
    let mut out = String::new();
    let mut written = Vec::new();
    for (title, entries) in SECTIONS {
        let missing: Vec<&Entry> = entries.iter().filter(|e| !skip.contains(e.key)).collect();
        if missing.is_empty() {
            continue;
        }
        out.push_str(&format!("\n# {title}\n"));
        for entry in missing {
            out.push_str(&render_entry(entry)?);
            written.push(entry.key);
        }
    }
    Ok((out, written))
}

fn write_private(path: &Path, content: &str, append: bool) -> std::io::Result<()> {
    let mut options = fs::OpenOptions::new();
    options.write(true);
    if append {
        options.append(true);
    } else {
        options.create_new(true);
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options.open(path)?.write_all(content.as_bytes())
}

/// Runs the task. Needs no database, so `main` calls it before connecting.
///
/// Arguments: `--output <path>` (default `.env`), `--stdout` (print a fresh file, write nothing).
pub fn generate_env(args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
    let mut output = ".env".to_string();
    let mut to_stdout = false;
    let mut iter = args.iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--stdout" => to_stdout = true,
            "--output" | "-o" => output = iter.next().ok_or("--output needs a path")?.clone(),
            other => return Err(format!("Unknown argument '{other}' (use --output <path> or --stdout)").into()),
        }
    }

    if to_stdout {
        let (content, _) = render(&HashSet::new())?;
        print!("# Generated by `task {NAME}`\n{content}");
        return Ok(());
    }

    let path = Path::new(&output);
    println!("\n{}", "=".repeat(60));
    println!(" GENERATE .ENV");
    println!("{}", "=".repeat(60));

    if path.exists() {
        let existing = fs::read_to_string(path)?;
        let (content, written) = render(&existing_keys(&existing))?;
        if written.is_empty() {
            println!("✅ {} already has every key; nothing changed", path.display());
        } else {
            let separator = if existing.ends_with('\n') || existing.is_empty() { "" } else { "\n" };
            let block = format!("{separator}\n# Added by `task {NAME}`\n{content}");
            write_private(path, &block, true)?;
            println!("✅ Added {} missing key(s) to {}:", written.len(), path.display());
            for key in written {
                println!("   + {key}");
            }
            println!("   Existing values were left unchanged.");
        }

        if let Some(problem) = jwt_secret_problem(&existing) {
            println!("{}", "-".repeat(60));
            println!("⚠️  {problem}: anyone who knows or guesses it can forge login tokens.");
            println!("   It was left unchanged. Generate a new one and paste it into {}", path.display());
            println!("   (all users will have to log in again):");
            println!("   openssl rand -base64 64 | tr -d '\\n'");
        }
    } else {
        let (content, written) = render(&HashSet::new())?;
        write_private(path, &format!("# Generated by `task {NAME}`\n{content}"), false)?;
        println!("✅ Created {} with {} key(s) (mode 600)", path.display(), written.len());
    }

    println!("{}", "-".repeat(60));
    println!("Next: replace every CHANGE_ME value, then uncomment the optional keys you need.");
    println!("{}", "=".repeat(60));
    println!();
    Ok(())
}

#[async_trait]
impl Task for GenerateEnvTask {
    fn name(&self) -> &str {
        NAME
    }

    fn description(&self) -> &str {
        "Creates .env with every key the server reads (secrets generated), or adds only the missing keys to an existing one (--output <path>, --stdout)"
    }

    async fn run(&self, _db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        generate_env(args)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn existing_keys_include_commented_and_exported() {
        let keys = existing_keys("A_KEY=1\n# SMTP_HOST=\"x\"\nexport JWT_SECRET=y\n# just a comment\nlower=1\n");
        assert!(keys.contains("A_KEY") && keys.contains("SMTP_HOST") && keys.contains("JWT_SECRET"));
        assert!(!keys.contains("lower"));
        assert_eq!(keys.len(), 3);
    }

    #[test]
    fn render_skips_present_keys_and_generates_secrets() {
        let skip: HashSet<String> = ["APP_ENCRYPTION_KEY".to_string()].into();
        let (content, written) = render(&skip).unwrap();
        assert!(!written.contains(&"APP_ENCRYPTION_KEY"));
        assert!(written.contains(&"JWT_SECRET"));

        let secret = content
            .lines()
            .find_map(|l| l.strip_prefix("MIAB_WEBHOOK_SECRET=\""))
            .unwrap()
            .trim_end_matches('"');
        assert_eq!(secret.len(), 64);
        assert!(content.contains("# SMTP_HOST="), "optional keys are commented out");
    }

    #[test]
    fn commented_jwt_secret_counts_as_missing() {
        let keys = existing_keys("# JWT_SECRET=\"old\"\n# SMTP_HOST=\"x\"\n");
        assert!(!keys.contains("JWT_SECRET"), "a commented-out JWT_SECRET must be added for real");
        assert!(keys.contains("SMTP_HOST"));

        let (content, written) = render(&keys).unwrap();
        assert!(written.contains(&"JWT_SECRET"));
        assert!(content.lines().any(|l| l.starts_with("JWT_SECRET=\"")), "added uncommented");
    }

    #[test]
    fn weak_jwt_secrets_are_reported() {
        assert!(jwt_secret_problem("JWT_SECRET=\"\"").unwrap().contains("empty"));
        let default = format!("JWT_SECRET=\"{}\"", jwt::DEFAULT_SECRET);
        assert!(jwt_secret_problem(&default).unwrap().contains("default"));
        assert!(jwt_secret_problem("JWT_SECRET=short").unwrap().contains("characters"));

        let strong = format!("JWT_SECRET=\"{}\"", "x".repeat(MIN_JWT_SECRET_LEN));
        assert_eq!(jwt_secret_problem(&strong), None);
        assert_eq!(jwt_secret_problem("# JWT_SECRET=short"), None, "commented out: a new one is added instead");
        assert_eq!(jwt_secret_problem("OTHER=1"), None);
    }

    #[test]
    fn keys_are_unique() {
        let mut seen = HashSet::new();
        for (_, entries) in SECTIONS {
            for entry in *entries {
                assert!(seen.insert(entry.key), "{} listed twice", entry.key);
            }
        }
    }
}
