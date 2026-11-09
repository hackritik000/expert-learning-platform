import { IMAGE_EXTENSIONS } from './constant';

export const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXTENSIONS.includes(ext);
};
