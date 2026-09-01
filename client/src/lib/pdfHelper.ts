import { toast } from '~/components/toast/Toaster';

/**
 * Handles opening or downloading a PDF Blob safely across all browsers.
 * If popups are enabled and allowed, it opens the PDF in a new tab.
 * If the browser blocks popups (standard behavior after async API fetch),
 * it seamlessly falls back to triggering a direct file download and notifies the user.
 *
 * @param blob The PDF Blob received from the server
 * @param filename The default filename to use for download (e.g. "KRS_20231.pdf")
 * @param docTitle Descriptive title for user notifications (e.g. "KRS (Kartu Rencana Studi)")
 */
export function openOrDownloadPdf(blob: Blob, filename: string, docTitle = 'Document PDF') {
    const url = window.URL.createObjectURL(blob);
    let popup: Window | null = null;

    try {
        popup = window.open(url, '_blank');
    } catch (_) {
        popup = null;
    }

    // Check if the browser blocked the popup window
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Fallback: Programmatic direct file download via anchor click
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast.info(`Pop-up browser diblokir. File ${docTitle} otomatis diunduh langsung.`);
    } else {
        try {
            popup.focus();
        } catch (_) {}
        toast.success(`${docTitle} berhasil dibuka di tab baru.`);
    }

    // Revoke Object URL after 60 seconds to release memory
    setTimeout(() => {
        try {
            window.URL.revokeObjectURL(url);
        } catch (_) {}
    }, 60000);
}
