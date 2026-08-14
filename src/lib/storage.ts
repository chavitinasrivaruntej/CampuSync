import { supabase, isSupabaseConfigured } from './supabase';

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'ppt' | 'xls' | 'image' | 'zip' | 'file';
  size: string;
  uploadedAt: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileTypeCategory(fileName: string, fileType: string): FileAttachment['type'] {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext) || fileType.includes('pdf')) return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext) || fileType.includes('word') || fileType.includes('document')) return 'doc';
  if (['ppt', 'pptx'].includes(ext) || fileType.includes('presentation') || fileType.includes('powerpoint')) return 'ppt';
  if (['xls', 'xlsx', 'csv'].includes(ext) || fileType.includes('excel') || fileType.includes('spreadsheet')) return 'xls';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) || fileType.includes('image')) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || fileType.includes('zip') || fileType.includes('compressed')) return 'zip';
  return 'file';
}

export async function uploadAttachment(file: File): Promise<FileAttachment> {
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const category = getFileTypeCategory(file.name, file.type);
  const formattedSize = formatFileSize(file.size);
  const uploadedAt = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const filePath = `attachments/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage.from('campusync-attachments').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('campusync-attachments').getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          return {
            id: fileId,
            name: file.name,
            url: publicUrlData.publicUrl,
            type: category,
            size: formattedSize,
            uploadedAt
          };
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload failed or bucket not created, using local data URL fallback.', err);
    }
  }

  // Fallback to Data URL for instant local preview and offline availability
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: fileId,
        name: file.name,
        url: reader.result as string,
        type: category,
        size: formattedSize,
        uploadedAt
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export async function deleteAttachmentFile(fileUrl?: string): Promise<void> {
  if (!fileUrl || !isSupabaseConfigured) return;
  try {
    if (fileUrl.includes('/storage/v1/object/public/campusync-attachments/')) {
      const path = fileUrl.split('/campusync-attachments/')[1];
      if (path) {
        await supabase.storage.from('campusync-attachments').remove([path]);
      }
    }
  } catch (err) {
    console.warn('Failed to delete attachment from Supabase storage:', err);
  }
}
