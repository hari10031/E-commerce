import type { Area } from 'react-easy-crop';

export async function cropImageFile(file: File, pixelCrop: Area): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(
    bitmap,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Crop failed'))),
      'image/jpeg',
      0.92
    );
  });

  const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${base}-cropped.jpg`, { type: 'image/jpeg' });
}
