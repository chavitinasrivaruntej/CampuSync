import { toast } from 'sonner';

/**
 * Universal helper to trigger true browser file downloads for Base64 strings,
 * Supabase storage links, PDFs, images, and documents.
 */
export async function downloadFile(url: string, fileName?: string) {
  if (!url) {
    toast.error('No file URL available for download.');
    return;
  }

  const name = fileName || `Document_${Date.now()}`;
  const toastId = toast.loading(`Downloading ${name}...`);

  try {
    // Case 1: Base64 Data URI
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloaded ${name}`, { id: toastId });
      return;
    }

    // Case 2: Network / Cross-Origin Remote URL
    // Fetch blob to bypass cross-origin browser download restrictions
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);

    toast.success(`Downloaded ${name}`, { id: toastId });
  } catch (error) {
    console.warn('Blob fetch failed, falling back to direct link download:', error);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Opening ${name}`, { id: toastId });
    } catch (fallbackError) {
      toast.error('Failed to download file. Please check your browser settings.', { id: toastId });
    }
  }
}
