use std::path::Path;

use anyhow::{Context, Result, bail};
use tokio::process::Command;

/// Converts a PDF to Markdown with the `docling` CLI (see README "Python Tools").
/// The Markdown file is written to `output_dir` and its content returned.
/// The binary can be overridden with `DOCLING_BIN`.
pub async fn pdf_to_markdown(pdf: &Path, output_dir: &Path) -> Result<String> {
    let docling = std::env::var("DOCLING_BIN").unwrap_or_else(|_| "docling".to_string());

    let output = Command::new(&docling)
        .arg(pdf)
        .args(["--from", "pdf", "--to", "md", "--image-export-mode", "placeholder", "--output"])
        .arg(output_dir)
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
