/**
 * Pixelation processing module using Canvas API.
 * Modifies image pixels within circular regions while preserving non-selected areas.
 */

export const INTENSITY_LEVELS = {
  MODERATE: { id: 'moderate', label: 'Moderado', factor: 0.16, minBlock: 8 },
  MEDIUM: { id: 'medium', label: 'Medio', factor: 0.28, minBlock: 14 },
  INTENSE: { id: 'intense', label: 'Intenso', factor: 0.44, minBlock: 22 }
};

/**
 * Calculates pixel block size based on radius and intensity settings.
 * Ensures the pixelation is visible and effective regardless of image resolution.
 */
export function getBlockSize(radius, intensityKey = 'intense') {
  const config = INTENSITY_LEVELS[intensityKey.toUpperCase()] || INTENSITY_LEVELS.INTENSE;
  const computed = Math.round(radius * config.factor);
  return Math.max(config.minBlock, computed);
}

/**
 * Applies real pixelation to an array of circular regions on a native resolution Canvas.
 *
 * @param {HTMLCanvasElement} targetCanvas - Canvas holding the full-resolution image.
 * @param {Array<{x: number, y: number, radius: number}>} circles - Circular regions in image coordinates.
 * @param {string} intensityKey - 'moderate' | 'medium' | 'intense'
 * @returns {HTMLCanvasElement} - The modified targetCanvas.
 */
export function applyPixelation(targetCanvas, circles, intensityKey = 'intense') {
  if (!targetCanvas || !circles || circles.length === 0) {
    return targetCanvas;
  }

  const ctx = targetCanvas.getContext('2d');
  const width = targetCanvas.width;
  const height = targetCanvas.height;

  // Process each selected circle
  for (const circle of circles) {
    const cx = Math.round(circle.x);
    const cy = Math.round(circle.y);
    const r = Math.round(circle.radius);

    // Calculate clamped bounding box
    const minX = Math.max(0, cx - r);
    const minY = Math.max(0, cy - r);
    const maxX = Math.min(width, cx + r);
    const maxY = Math.min(height, cy + r);
    const boxW = maxX - minX;
    const boxH = maxY - minY;

    if (boxW <= 0 || boxH <= 0) continue;

    // Determine pixel block size
    const blockSize = getBlockSize(r, intensityKey);

    // Calculate downscaled dimensions (minimum 1x1 block)
    const smallW = Math.max(1, Math.floor(boxW / blockSize));
    const smallH = Math.max(1, Math.floor(boxH / blockSize));

    // Create temporary offscreen canvas for downscaling
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = smallW;
    tempCanvas.height = smallH;
    const tempCtx = tempCanvas.getContext('2d');

    // Smoothly downscale the region to compute average color blocks
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'medium';
    tempCtx.drawImage(targetCanvas, minX, minY, boxW, boxH, 0, 0, smallW, smallH);

    // Save context state for clipping mask
    ctx.save();

    // Define circular clipping path
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Render back using nearest-neighbor interpolation to generate distinct pixel blocks
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, smallW, smallH, minX, minY, boxW, boxH);

    // Restore context
    ctx.restore();

    // Clean up temporary canvas
    tempCanvas.width = 0;
    tempCanvas.height = 0;
  }

  return targetCanvas;
}
