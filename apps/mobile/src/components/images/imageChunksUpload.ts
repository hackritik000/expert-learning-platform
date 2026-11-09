// NOTE: Image chunk upload is good idea only for images larger then 5MB
//  in real production application I choose check image size and choose
//  should I use chunk upload or not

import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { IMAGE_HANDLER_URL } from '@/constants/config';

const CHUNK_SIZE = 1024 * 1024;

export async function uploadFile(filePath: string, folder: string) {
  const file = new File(filePath);

  const uploadId = Math.random().toString(36).slice(2);
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  const handle = file.open();

  try {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const chunkSize = Math.min(CHUNK_SIZE, file.size - start);

      handle.offset = start;

      const bytes = await handle.readBytes(chunkSize);

      const response = await fetch(
        `${IMAGE_HANDLER_URL}/upload/chunk?uploadId=${uploadId}&chunkIndex=${i}&totalChunks=${totalChunks}&fileName=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: bytes,
        },
      );

      if (!response.ok) {
        throw new Error(`Chunk ${i} failed: ${response.status}`);
      }

      console.log(`Uploaded chunk ${i + 1}/${totalChunks}`);
    }
  } finally {
    handle.close();
  }

  const response = await fetch(`${IMAGE_HANDLER_URL}/upload/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uploadId,
      fileName: file.name,
      totalChunks,
      folderName: folder,
    }),
  });

  if (!response.ok) {
    throw new Error(`Upload completion failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Upload failed');
  }

  return data.file;
}
