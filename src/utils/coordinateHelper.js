/**
 * Helper utilities for mapping between screen display coordinates and native image coordinates.
 */

export class CoordinateHelper {
  constructor() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.renderedWidth = 0;
    this.renderedHeight = 0;
    this.displayWidth = 0;
    this.displayHeight = 0;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
  }

  /**
   * Recalculate scaling and centering offsets based on display container and natural image dimensions.
   */
  update(displayWidth, displayHeight, naturalWidth, naturalHeight) {
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
    this.naturalWidth = naturalWidth;
    this.naturalHeight = naturalHeight;

    if (!naturalWidth || !naturalHeight || !displayWidth || !displayHeight) {
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.renderedWidth = 0;
      this.renderedHeight = 0;
      return;
    }

    // Maintain aspect ratio with "contain" strategy
    this.scale = Math.min(displayWidth / naturalWidth, displayHeight / naturalHeight);
    this.renderedWidth = naturalWidth * this.scale;
    this.renderedHeight = naturalHeight * this.scale;
    this.offsetX = (displayWidth - this.renderedWidth) / 2;
    this.offsetY = (displayHeight - this.renderedHeight) / 2;
  }

  /**
   * Convert display coordinates (e.g. mouse/touch position on canvas) to native image coordinates.
   */
  displayToImage(clientX, clientY, canvasRect) {
    const canvasX = clientX - canvasRect.left;
    const canvasY = clientY - canvasRect.top;

    const imgX = (canvasX - this.offsetX) / this.scale;
    const imgY = (canvasY - this.offsetY) / this.scale;

    return {
      x: imgX,
      y: imgY,
      isInside:
        imgX >= 0 &&
        imgX <= this.naturalWidth &&
        imgY >= 0 &&
        imgY <= this.naturalHeight
    };
  }

  /**
   * Convert native image coordinates to display coordinates for drawing on the overlay canvas.
   */
  imageToDisplay(imgX, imgY, imgRadius = 0) {
    return {
      x: imgX * this.scale + this.offsetX,
      y: imgY * this.scale + this.offsetY,
      radius: imgRadius * this.scale
    };
  }

  /**
   * Check if a point in display coordinates is within the rendered image area.
   */
  isPointInImageBounds(displayX, displayY) {
    return (
      displayX >= this.offsetX &&
      displayX <= this.offsetX + this.renderedWidth &&
      displayY >= this.offsetY &&
      displayY <= this.offsetY + this.renderedHeight
    );
  }
}
