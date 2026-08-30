export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  outputFormat: "image/png" | "image/webp" | "image/jpeg" = "image/png",
  // Largura mínima de saída em px — garante capas nítidas mesmo quando a foto original é pequena.
  // Use 0 para desabilitar normalização (ex: avatares).
  minOutputWidth = 0,
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return "";
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Clear rect to ensure 100% transparent background (no black or white canvas fill)
  ctx.clearRect(0, 0, bBoxWidth, bBoxHeight);

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return "";
  }

  // Calcula dimensões de saída: se minOutputWidth > 0 e o crop é menor,
  // escala para cima preservando proporção. Se o crop já é maior, usa as dimensões reais.
  let outWidth = pixelCrop.width;
  let outHeight = pixelCrop.height;
  if (minOutputWidth > 0 && outWidth < minOutputWidth) {
    const scale = minOutputWidth / outWidth;
    outWidth = Math.round(minOutputWidth);
    outHeight = Math.round(pixelCrop.height * scale);
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = outWidth;
  croppedCanvas.height = outHeight;

  // Clear rect on cropped canvas for transparent pixels
  croppedCtx.clearRect(0, 0, outWidth, outHeight);

  // Draw the cropped image onto the new canvas (with optional scaling)
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outWidth,
    outHeight,
  );

  // Return Base64 as PNG to preserve full alpha channel transparency
  return croppedCanvas.toDataURL(outputFormat, 1.0);
}
