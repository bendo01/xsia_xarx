use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::path::{Path, PathBuf};

pub struct EncodeService;

impl EncodeService {
    /// Encodes an image file to a base64 string.
    ///
    /// The path will be resolved using `APP_DIRECTORY` environment variable if relative,
    /// or from the current working directory as fallback.
    ///
    /// # Arguments
    ///
    /// * `image_path` - The relative or absolute path to the image file.
    ///
    /// # Returns
    ///
    /// A base64 encoded string of the image.
    ///
    /// # Errors
    ///
    /// Returns an `std::io::Error` if:
    /// - The image file cannot be read
    /// - The path is invalid or does not exist
    pub fn base64_encode(image_path: &str) -> Result<String, std::io::Error> {
        let path = Self::resolve_path(image_path);
        let image_bytes = std::fs::read(&path).map_err(|e| {
            std::io::Error::new(
                e.kind(),
                format!("Failed to read image at '{}': {e}", path.display()),
            )
        })?;
        Ok(STANDARD.encode(&image_bytes))
    }

    /// Encodes an image file from a specified base directory to a base64 string.
    ///
    /// # Arguments
    ///
    /// * `app_directory` - The base directory.
    /// * `image_path` - The relative path to the image file.
    pub fn base64_encode_with_directory(
        app_directory: &str,
        image_path: &str,
    ) -> Result<String, std::io::Error> {
        let full_path = Path::new(app_directory).join(image_path);
        let image_bytes = std::fs::read(&full_path).map_err(|e| {
            std::io::Error::new(
                e.kind(),
                format!("Failed to read image at '{}': {e}", full_path.display()),
            )
        })?;
        Ok(STANDARD.encode(&image_bytes))
    }

    /// Encodes raw image bytes into a base64 string.
    ///
    /// # Arguments
    ///
    /// * `image_bytes` - Slice of bytes representing the image.
    pub fn base64_encode_bytes(image_bytes: &[u8]) -> String {
        STANDARD.encode(image_bytes)
    }

    /// Encodes an image to a base64 Data URI (e.g. `data:image/png;base64,...`).
    ///
    /// # Arguments
    ///
    /// * `image_path` - The relative or absolute path to the image file.
    /// * `mime_type` - Optional MIME type. If `None`, will attempt to guess from extension.
    pub fn base64_data_uri(
        image_path: &str,
        mime_type: Option<&str>,
    ) -> Result<String, std::io::Error> {
        let encoded = Self::base64_encode(image_path)?;
        let mime = mime_type.unwrap_or_else(|| Self::guess_mime_type(image_path));
        Ok(format!("data:{mime};base64,{encoded}"))
    }

    /// Helper to resolve path using `APP_DIRECTORY` environment variable if relative.
    fn resolve_path(image_path: &str) -> PathBuf {
        let path = Path::new(image_path);
        if path.is_absolute() {
            return path.to_path_buf();
        }

        if let Ok(app_dir) = std::env::var("APP_DIRECTORY")
            && !app_dir.is_empty() {
                let resolved = Path::new(&app_dir).join(image_path);
                if resolved.exists() {
                    return resolved;
                }
        }

        path.to_path_buf()
    }

    /// Helper to guess image MIME type from file extension.
    fn guess_mime_type(path_str: &str) -> &'static str {
        let path = Path::new(path_str);
        match path.extension().and_then(|ext| ext.to_str()).map(|s| s.to_lowercase()).as_deref() {
            Some("png") => "image/png",
            Some("jpg") | Some("jpeg") => "image/jpeg",
            Some("webp") => "image/webp",
            Some("svg") => "image/svg+xml",
            Some("gif") => "image/gif",
            Some("ico") => "image/x-icon",
            Some("bmp") => "image/bmp",
            _ => "image/png",
        }
    }
}
