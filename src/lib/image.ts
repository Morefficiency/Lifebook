/**
 * Vision-board images.
 *
 * Downscaled and re-encoded in the browser before they are stored, so the state
 * document stays a sane size and the export stays portable. The file never
 * leaves the device — there is nothing in here that touches the network.
 */
export const MAX_EDGE = 900;
export const QUALITY = 0.72;

export async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser would not give us a canvas to resize the image on.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', QUALITY);
}
