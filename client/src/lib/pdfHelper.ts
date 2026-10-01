import { toast } from '~/components/toast/Toaster';

/**
 * Directly downloads a PDF Blob to the user's computer/device without opening a new tab.
 *
 * @param blob The PDF Blob received from the server
 * @param filename The filename to use for download (e.g. "KRS_12345_Semester_1.pdf")
 * @param docTitle Descriptive title for user notifications (e.g. "KRS (Kartu Rencana Studi)")
 */
export function downloadPdf(blob: Blob, filename: string, docTitle = 'Document PDF') {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success(`File ${docTitle} berhasil diunduh.`);

    setTimeout(() => {
        try {
            window.URL.revokeObjectURL(url);
        } catch {}
    }, 60000);
}

/**
 * Handles opening or downloading a PDF Blob safely across all browsers.
 * If forceDownload is true, directly triggers file download without opening a new tab.
 * If false, it tries opening the PDF in a new tab, falling back to direct download if popups are blocked.
 *
 * @param blob The PDF Blob received from the server
 * @param filename The default filename to use for download (e.g. "KRS_20231.pdf")
 * @param docTitle Descriptive title for user notifications (e.g. "KRS (Kartu Rencana Studi)")
 * @param forceDownload Set to true to always download directly
 */
export function openOrDownloadPdf(
    blob: Blob,
    filename: string,
    docTitle = 'Document PDF',
    forceDownload = false
) {
    if (forceDownload) {
        return downloadPdf(blob, filename, docTitle);
    }

    const url = window.URL.createObjectURL(blob);
    let popup: Window | null = null;

    try {
        popup = window.open(url, '_blank');
    } catch {
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

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('popup-blocked', { detail: { docTitle, filename } }));
        }

        toast.info(`Pop-up browser diblokir. File ${docTitle} otomatis diunduh langsung.`);
    } else {
        try {
            popup.focus();
        } catch {}
        toast.success(`${docTitle} berhasil dibuka di tab baru.`);
    }

    // Revoke Object URL after 60 seconds to release memory
    setTimeout(() => {
        try {
            window.URL.revokeObjectURL(url);
        } catch {}
    }, 60000);
}
