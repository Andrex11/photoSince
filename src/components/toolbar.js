/**
 * Toolbar component managing action buttons, pixelation intensity,
 * and contextual circle adjustment controls.
 */

export class Toolbar {
  constructor(containerElement, callbacks = {}) {
    this.container = containerElement;
    this.callbacks = callbacks;

    // Elements
    this.btnImport = null;
    this.btnSelectMode = null;
    this.btnPixelate = null;
    this.btnUndo = null;
    this.btnReset = null;
    this.btnDownload = null;

    // Intensity controls
    this.sliderIntensity = null;
    this.labelIntensity = null;

    // Contextual circle controls
    this.circleControlsPanel = null;
    this.circleTitle = null;
    this.btnRadiusMinus = null;
    this.btnRadiusPlus = null;
    this.sliderRadius = null;
    this.btnDeleteCircle = null;

    this.init();
  }

  init() {
    this.btnImport = this.container.querySelector('#btn-import');
    this.btnSelectMode = this.container.querySelector('#btn-select-mode');
    this.btnPixelate = this.container.querySelector('#btn-pixelate');
    this.btnUndo = this.container.querySelector('#btn-undo');
    this.btnReset = this.container.querySelector('#btn-reset');
    this.btnDownload = this.container.querySelector('#btn-download');

    this.sliderIntensity = this.container.querySelector('#intensity-slider');
    this.labelIntensity = this.container.querySelector('#intensity-val-label');

    this.circleControlsPanel = document.querySelector('#circle-controls-bar');
    this.circleTitle = document.querySelector('#circle-selected-title');
    this.btnRadiusMinus = document.querySelector('#btn-radius-minus');
    this.btnRadiusPlus = document.querySelector('#btn-radius-plus');
    this.sliderRadius = document.querySelector('#slider-radius');
    this.btnDeleteCircle = document.querySelector('#btn-delete-circle');

    this.bindEvents();
  }

  bindEvents() {
    if (this.btnImport) {
      this.btnImport.addEventListener('click', () => {
        if (this.callbacks.onImport) this.callbacks.onImport();
      });
    }

    if (this.btnSelectMode) {
      this.btnSelectMode.addEventListener('click', () => {
        if (this.callbacks.onToggleSelectMode) this.callbacks.onToggleSelectMode();
      });
    }

    if (this.btnPixelate) {
      this.btnPixelate.addEventListener('click', () => {
        if (this.callbacks.onPixelate && !this.btnPixelate.disabled) {
          this.callbacks.onPixelate();
        }
      });
    }

    if (this.btnUndo) {
      this.btnUndo.addEventListener('click', () => {
        if (this.callbacks.onUndo && !this.btnUndo.disabled) {
          this.callbacks.onUndo();
        }
      });
    }

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        if (this.callbacks.onResetSelection && !this.btnReset.disabled) {
          this.callbacks.onResetSelection();
        }
      });
    }

    if (this.btnDownload) {
      this.btnDownload.addEventListener('click', () => {
        if (this.callbacks.onDownload && !this.btnDownload.disabled) {
          this.callbacks.onDownload();
        }
      });
    }

    // Intensity slider change
    if (this.sliderIntensity) {
      this.sliderIntensity.addEventListener('input', (e) => {
        const val = e.target.value;
        const map = { '1': 'moderate', '2': 'medium', '3': 'intense' };
        const labelMap = { '1': 'Moderado', '2': 'Medio', '3': 'Intenso' };
        const intensityKey = map[val] || 'intense';
        if (this.labelIntensity) {
          this.labelIntensity.textContent = labelMap[val] || 'Intenso';
        }
        if (this.callbacks.onIntensityChange) {
          this.callbacks.onIntensityChange(intensityKey);
        }
      });
    }

    // Contextual circle adjustments
    if (this.btnRadiusMinus) {
      this.btnRadiusMinus.addEventListener('click', () => {
        if (this.callbacks.onAdjustRadius) this.callbacks.onAdjustRadius(-8);
      });
    }

    if (this.btnRadiusPlus) {
      this.btnRadiusPlus.addEventListener('click', () => {
        if (this.callbacks.onAdjustRadius) this.callbacks.onAdjustRadius(8);
      });
    }

    if (this.sliderRadius) {
      this.sliderRadius.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.callbacks.onSetRadius) this.callbacks.onSetRadius(val);
      });
    }

    if (this.btnDeleteCircle) {
      this.btnDeleteCircle.addEventListener('click', () => {
        if (this.callbacks.onDeleteSelectedCircle) this.callbacks.onDeleteSelectedCircle();
      });
    }
  }

  /**
   * Updates disabled/active states for buttons based on app state.
   */
  updateState({
    hasImage = false,
    selectedCount = 0,
    canUndo = false,
    hasProcessed = false,
    selectedCircle = null,
    minRadius = 15,
    maxRadius = 300
  }) {
    // Import is always enabled
    if (this.btnImport) this.btnImport.disabled = false;

    // Mode toggle
    if (this.btnSelectMode) {
      this.btnSelectMode.disabled = !hasImage;
      this.btnSelectMode.classList.toggle('active-mode', hasImage);
    }

    // Pixelate button
    if (this.btnPixelate) {
      this.btnPixelate.disabled = !hasImage || selectedCount === 0;
      const countBadge = this.btnPixelate.querySelector('.btn-badge');
      if (countBadge) {
        countBadge.textContent = selectedCount > 0 ? selectedCount : '';
        countBadge.style.display = selectedCount > 0 ? 'inline-flex' : 'none';
      }
    }

    // Undo button
    if (this.btnUndo) {
      this.btnUndo.disabled = !hasImage || !canUndo;
    }

    // Reset selection button
    if (this.btnReset) {
      this.btnReset.disabled = !hasImage || selectedCount === 0;
    }

    // Download button
    if (this.btnDownload) {
      this.btnDownload.disabled = !hasImage || !hasProcessed;
    }

    // Contextual circle controls
    if (this.circleControlsPanel) {
      if (hasImage && selectedCircle) {
        this.circleControlsPanel.classList.remove('hidden');
        if (this.circleTitle) {
          this.circleTitle.textContent = `Ajustar círculo seleccionado`;
        }
        if (this.sliderRadius) {
          this.sliderRadius.min = minRadius;
          this.sliderRadius.max = maxRadius;
          this.sliderRadius.value = Math.round(selectedCircle.radius);
        }
      } else {
        this.circleControlsPanel.classList.add('hidden');
      }
    }
  }

  getIntensity() {
    if (!this.sliderIntensity) return 'intense';
    const val = this.sliderIntensity.value;
    const map = { '1': 'moderate', '2': 'medium', '3': 'intense' };
    return map[val] || 'intense';
  }
}
