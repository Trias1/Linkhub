// Perkecil foto di browser sebelum upload. Batas request di Vercel 4,5 MB (foto kamera HP sering 5-10 MB),
// dan halaman publik tidak butuh foto lebih dari 1600px.
const MAX_SIDE = 1600;
export const MAX_UPLOAD = 4 * 1024 * 1024;

const encode = (canvas: HTMLCanvasElement, type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82));

export async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 600 * 1024) { bitmap.close(); return file; }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Safari lama tidak bisa membuat WebP (hasilnya PNG besar); kalau begitu pakai JPEG.
  let blob = await encode(canvas, "image/webp");
  if (!blob || blob.type !== "image/webp") blob = await encode(canvas, "image/jpeg");
  if (!blob || blob.size >= file.size) return file;
  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${file.name.replace(/\.[^.]*$/, "") || "photo"}.${extension}`, { type: blob.type });
}
