/** Dimensioni fisse di compressione: lato lungo max 800px, qualità JPEG 0.8 */
const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.8;

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Carica un File in un HTMLImageElement pronto per il canvas */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Ritaglia una regione dell'immagine sorgente, restituisce un canvas */
export function cropToCanvas(img: HTMLImageElement, rect: CropRect): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return canvas;
}

/** Ridimensiona un canvas mantenendo l'aspect ratio, lato lungo = MAX_DIMENSION */
export function resizeCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height));
  if (scale === 1) return source;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Converte un canvas in Blob JPEG compresso */
export function canvasToCompressedBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Compressione fallita'))),
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

/** Pipeline completa: crop (opzionale) + resize + compressione → Blob pronto per upload */
export async function processImage(img: HTMLImageElement, cropRect?: CropRect): Promise<Blob> {
  let canvas: HTMLCanvasElement;

  if (cropRect) {
    canvas = cropToCanvas(img, cropRect);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
  }

  canvas = resizeCanvas(canvas);
  return canvasToCompressedBlob(canvas);
}

/**
 * Taglia un'immagine (già ritagliata sull'area del foglio) in una griglia rows×cols.
 * Restituisce un array di Blob compressi, in ordine riga per riga (sinistra→destra, alto→basso).
 */
export async function sliceImageGrid(
  img: HTMLImageElement,
  sheetRect: CropRect,
  rows: number,
  cols: number
): Promise<Blob[]> {
  const cellWidth = sheetRect.width / cols;
  const cellHeight = sheetRect.height / rows;
  const blobs: Blob[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellRect: CropRect = {
        x: sheetRect.x + c * cellWidth,
        y: sheetRect.y + r * cellHeight,
        width: cellWidth,
        height: cellHeight,
      };
      let canvas = cropToCanvas(img, cellRect);
      canvas = resizeCanvas(canvas);
      blobs.push(await canvasToCompressedBlob(canvas));
    }
  }

  return blobs;
}