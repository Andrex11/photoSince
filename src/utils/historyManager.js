/**
 * Manages image state history for the Undo ("Deshacer cambios") feature.
 * Uses ImageBitmap or OffscreenCanvas to optimize memory consumption.
 */

export class HistoryManager {
  constructor(maxStates = 8) {
    this.maxStates = maxStates;
    this.stack = [];
    this.initialState = null;
  }

  /**
   * Set the initial untouched image state when an image is first loaded.
   */
  async setInitialState(canvas) {
    this.clear();
    this.initialState = await this._createSnapshot(canvas);
  }

  /**
   * Save a snapshot of the canvas before a modification is applied.
   */
  async push(canvas) {
    const snapshot = await this._createSnapshot(canvas);
    this.stack.push(snapshot);

    // Evict oldest state if exceeding max history capacity
    if (this.stack.length > this.maxStates) {
      const removed = this.stack.shift();
      this._disposeSnapshot(removed);
    }
  }

  /**
   * Revert to the previous image state.
   * Restores into targetCanvas.
   * Returns true if undo was performed, false if no states remain.
   */
  async undo(targetCanvas) {
    if (!this.canUndo()) {
      return false;
    }

    const previousSnapshot = this.stack.pop();
    await this._restoreSnapshot(previousSnapshot, targetCanvas);
    this._disposeSnapshot(previousSnapshot);
    return true;
  }

  /**
   * Returns true if there is at least one undoable action.
   */
  canUndo() {
    return this.stack.length > 0;
  }

  /**
   * Count of undoable states.
   */
  get size() {
    return this.stack.length;
  }

  /**
   * Release all stored snapshots from memory.
   */
  clear() {
    for (const snapshot of this.stack) {
      this._disposeSnapshot(snapshot);
    }
    this.stack = [];

    if (this.initialState) {
      this._disposeSnapshot(this.initialState);
      this.initialState = null;
    }
  }

  // --- Internal helpers ---

  async _createSnapshot(canvas) {
    if (window.createImageBitmap) {
      try {
        const bitmap = await window.createImageBitmap(canvas);
        return { type: 'bitmap', data: bitmap, width: canvas.width, height: canvas.height };
      } catch {
        // Fallback to clone canvas
      }
    }

    const clone = document.createElement('canvas');
    clone.width = canvas.width;
    clone.height = canvas.height;
    const ctx = clone.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    return { type: 'canvas', data: clone, width: canvas.width, height: canvas.height };
  }

  async _restoreSnapshot(snapshot, targetCanvas) {
    if (!snapshot || !targetCanvas) return;

    targetCanvas.width = snapshot.width;
    targetCanvas.height = snapshot.height;
    const ctx = targetCanvas.getContext('2d');
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.drawImage(snapshot.data, 0, 0);
  }

  _disposeSnapshot(snapshot) {
    if (!snapshot) return;
    if (snapshot.type === 'bitmap' && snapshot.data && typeof snapshot.data.close === 'function') {
      snapshot.data.close();
    } else if (snapshot.type === 'canvas' && snapshot.data) {
      snapshot.data.width = 0;
      snapshot.data.height = 0;
    }
    snapshot.data = null;
  }
}
