/**
 * image-compression.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side image compression utility using Canvas API.
 * Zero external dependencies. Works in all modern browsers.
 *
 * Strategy:
 *  1. Load the file into an HTMLImageElement
 *  2. Draw into a Canvas capped at MAX_DIMENSION × MAX_DIMENSION (maintaining aspect)
 *  3. Export as WebP (85% quality) with JPEG fallback
 *  4. Return a new File with the compressed bytes
 */

const MAX_DIMENSION = 1920; // px (long edge)
const WEBP_QUALITY = 0.85;
const JPEG_QUALITY = 0.88;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // Don't compress files already smaller than 5MB

export interface CompressionResult {
  file: File;
  originalBytes: number;
  compressedBytes: number;
  ratio: number; // 0-1: smaller = more compression
  format: "webp" | "jpeg" | "original";
  width: number;
  height: number;
  previewUrl: string; // Object URL — caller must revoke when done
}

/** Check if the browser supports WebP encoding (not just decoding) */
function supportsWebP(): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

/** Load a File into an HTMLImageElement */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/** Calculate output dimensions preserving aspect ratio */
function calcDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDim: number
): { width: number; height: number } {
  if (srcWidth <= maxDim && srcHeight <= maxDim) {
    return { width: srcWidth, height: srcHeight };
  }
  const ratio = Math.min(maxDim / srcWidth, maxDim / srcHeight);
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
  };
}

/** Canvas blob promise wrapper */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
}

/**
 * Compress a single image File.
 * @param file - The original File (jpg, png, webp, heic, etc.)
 * @param options - Optional overrides
 */
export async function compressImage(
  file: File,
  options?: {
    maxDimension?: number;
    webpQuality?: number;
    jpegQuality?: number;
    skipIfSmaller?: number; // bytes threshold — skip if already small
  }
): Promise<CompressionResult> {
  const maxDim = options?.maxDimension ?? MAX_DIMENSION;
  const webpQ = options?.webpQuality ?? WEBP_QUALITY;
  const jpegQ = options?.jpegQuality ?? JPEG_QUALITY;
  const skipThreshold = options?.skipIfSmaller ?? MAX_FILE_BYTES;

  const originalBytes = file.size;

  // Skip non-images
  if (!file.type.startsWith("image/")) {
    const url = URL.createObjectURL(file);
    return {
      file,
      originalBytes,
      compressedBytes: originalBytes,
      ratio: 1,
      format: "original",
      width: 0,
      height: 0,
      previewUrl: url,
    };
  }

  // Load image
  const img = await loadImage(file);
  const { width: outW, height: outH } = calcDimensions(img.naturalWidth, img.naturalHeight, maxDim);

  // If image is already small and no resize needed, skip compression
  const needsResize = outW < img.naturalWidth || outH < img.naturalHeight;
  if (!needsResize && originalBytes < skipThreshold) {
    const url = URL.createObjectURL(file);
    return {
      file,
      originalBytes,
      compressedBytes: originalBytes,
      ratio: 1,
      format: "original",
      width: outW,
      height: outH,
      previewUrl: url,
    };
  }

  // Draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, outW, outH);

  // Try WebP first, fallback to JPEG
  const useWebP = supportsWebP();
  let blob: Blob | null = null;
  let format: "webp" | "jpeg" = "jpeg";

  if (useWebP) {
    blob = await canvasToBlob(canvas, "image/webp", webpQ);
    if (blob) format = "webp";
  }

  if (!blob || blob.size >= originalBytes) {
    // Fallback or WebP was bigger (rare)
    blob = await canvasToBlob(canvas, "image/jpeg", jpegQ);
    format = "jpeg";
  }

  if (!blob) {
    throw new Error("Canvas.toBlob() returned null — browser may not support compression.");
  }

  // If compressed is larger (PNG with solid colors etc.), keep original
  if (blob.size > originalBytes && !needsResize) {
    const url = URL.createObjectURL(file);
    return {
      file,
      originalBytes,
      compressedBytes: originalBytes,
      ratio: 1,
      format: "original",
      width: outW,
      height: outH,
      previewUrl: url,
    };
  }

  const ext = format === "webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const compressedFile = new File([blob], `${baseName}.${ext}`, {
    type: format === "webp" ? "image/webp" : "image/jpeg",
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(blob);

  return {
    file: compressedFile,
    originalBytes,
    compressedBytes: blob.size,
    ratio: blob.size / originalBytes,
    format,
    width: outW,
    height: outH,
    previewUrl,
  };
}

/**
 * Compress multiple images in parallel (max 4 concurrent).
 */
export async function compressImages(
  files: File[],
  options?: Parameters<typeof compressImage>[1]
): Promise<CompressionResult[]> {
  const CHUNK_SIZE = 4;
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    const chunk = files.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(chunk.map((f) => compressImage(f, options)));
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Format bytes into human-readable string (pt-BR friendly).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
