// Browser-only: prepare photos/screenshots for the AI import. Large photos
// are scaled down and re-encoded as JPEG so each request stays small, while
// keeping enough detail for small print.

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGES = 10;
const MAX_SIDE = 2400; // pixels on the long side
const MAX_BYTES = 6 * 1024 * 1024;

export type PreparedImage = {
  name: string;
  data: string;
  mime: "image/jpeg" | "image/png" | "image/webp";
};

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) {
    throw new Error(
      `${file.name}: use a JPG, PNG or WebP image. (iPhone HEIC photos: take a screenshot of the photo, or change the camera format to "Most compatible".)`,
    );
  }
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(`${file.name}: couldn't open this image.`);
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  // Small, already-compact images are sent as they are.
  if (scale === 1 && file.size <= MAX_BYTES / 2) {
    bitmap.close();
    return {
      name: file.name,
      data: bytesToBase64(new Uint8Array(await file.arrayBuffer())),
      mime: file.type as PreparedImage["mime"],
    };
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process this image.");
  ctx.fillStyle = "#fff"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  if (!blob) throw new Error(`${file.name}: couldn't process this image.`);
  if (blob.size > MAX_BYTES) throw new Error(`${file.name}: this image is too large.`);
  return {
    name: file.name,
    data: bytesToBase64(new Uint8Array(await blob.arrayBuffer())),
    mime: "image/jpeg",
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
