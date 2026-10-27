use std::path::Path;

use anyhow::{Context, Result, bail};
use tokio::process::Command;

/// Converts a PDF to Markdown with the `docling` CLI (see README "Python Tools").
/// The Markdown file is written to `output_dir` and its content returned.
/// The binary can be overridden with `DOCLING_BIN`.
pub async fn pdf_to_markdown(pdf: &Path, output_dir: &Path) -> Result<String> {
    let docling = std::env::var("DOCLING_BIN").unwrap_or_else(|_| "docling".to_string());

    // CPU only: docling's default `--device auto` picks CUDA when torch can see a GPU, so pin the device and
    // also hide the GPUs from the process. `DOCLING_NUM_THREADS` overrides docling's default of 4 threads.
    let threads = std::env::var("DOCLING_NUM_THREADS")
        .ok()
        .and_then(|v| v.parse::<u32>().ok())
        .filter(|n| *n > 0)
        .unwrap_or_else(|| std::thread::available_parallelism().map_or(4, |n| n.get() as u32));

    let output = Command::new(&docling)
        .arg(pdf)
        .args(["--from", "pdf", "--to", "md", "--image-export-mode", "placeholder", "--device", "cpu", "--num-threads"])
        .arg(threads.to_string())
        .arg("--output")
        .arg(output_dir)
        .env("CUDA_VISIBLE_DEVICES", "")
        .kill_on_drop(true)
        .output()
        .await
        .with_context(|| format!("Failed to run `{docling}`"))?;

    if !output.status.success() {
        bail!(
            "docling exited with {}: {}",
            output.status,
            String::from_utf8_lossy(&output.stderr).trim()
        );
    }

    let stem = pdf.file_stem().context("PDF path has no file name")?;
    let markdown_path = output_dir.join(stem).with_extension("md");
    tokio::fs::read_to_string(&markdown_path)
        .await
        .with_context(|| format!("docling produced no {}", markdown_path.display()))
}

/// Whether the `docling` CLI is installed (honours `DOCLING_BIN`). The binary is looked up, not run:
/// `docling --version` imports torch and takes 25 to 70 seconds, which made the check time out and the
/// status endpoints slow.
pub async fn is_available() -> bool {
    let docling = std::env::var("DOCLING_BIN").unwrap_or_else(|_| "docling".to_string());
    tokio::task::spawn_blocking(move || is_executable_on_path(&docling)).await.unwrap_or(false)
}

fn is_executable_on_path(name: &str) -> bool {
    use std::os::unix::fs::PermissionsExt;

    let is_executable = |path: &Path| path.metadata().is_ok_and(|m| m.is_file() && m.permissions().mode() & 0o111 != 0);
    if name.contains('/') {
        return is_executable(Path::new(name));
    }
    std::env::var_os("PATH").is_some_and(|paths| std::env::split_paths(&paths).any(|dir| is_executable(&dir.join(name))))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_binaries_on_the_path_and_by_path() {
        assert!(is_executable_on_path("sh"));
        assert!(is_executable_on_path("/bin/sh"));
        assert!(!is_executable_on_path("definitely-not-installed-xsia"));
        assert!(!is_executable_on_path("/nonexistent/docling"));
    }
}
