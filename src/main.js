/**
 * Pixelador de Rostros — Aplicación Principal
 * Arquitectura modular 100% cliente sin backend ni servicios externos.
 */

import { CoordinateHelper } from './utils/coordinateHelper.js';
import { applyPixelation } from './utils/pixelate.js';
import { HistoryManager } from './utils/historyManager.js';
import { NotificationManager } from './utils/notifications.js';
import { ImageUploader } from './components/imageUploader.js';
import { FaceSelector } from './components/faceSelector.js';
import { Toolbar } from './components/toolbar.js';
import { ExportModal } from './components/exportModal.js';

class FacePixelatorApp {
  constructor() {
    this.currentImage = null;
    this.currentFileInfo = null;
    this.hasProcessed = false;

    // DOM Elements
    this.dropzone = document.getElementById('dropzone');
    this.canvasContainer = document.getElementById('canvas-container');
    this.viewportWrapper = document.getElementById('viewport-wrapper');
    this.baseCanvas = document.getElementById('base-canvas');
    this.overlayCanvas = document.getElementById('overlay-canvas');
    this.baseCtx = this.baseCanvas.getContext('2d');
    this.overlayCtx = this.overlayCanvas.getContext('2d');

    this.processingOverlay = document.getElementById('processing-overlay');
    this.toastContainer = document.getElementById('toast-container');
    this.exportModalElement = document.getElementById('export-modal');
    this.privacyModalElement = document.getElementById('privacy-modal');
    this.helpBarMessage = document.getElementById('help-bar-message');
    this.imageMetaInfo = document.getElementById('image-meta-info');

    // Offscreen Master Canvas (Full Native Resolution)
    this.masterCanvas = document.createElement('canvas');
    this.masterCtx = this.masterCanvas.getContext('2d');

    // Core Utilities
    this.coordHelper = new CoordinateHelper();
    this.historyManager = new HistoryManager(8);
    this.notifications = new NotificationManager(this.toastContainer);

    // Components
    this.faceSelector = new FaceSelector(this.overlayCanvas, this.coordHelper, {
      onSelectionChange: this.handleSelectionChange.bind(this)
    });

    this.toolbar = new Toolbar(document.querySelector('.app-toolbar'), {
      onImport: () => this.imageUploader.openFilePicker(),
      onPixelate: () => this.handlePixelate(),
      onUndo: () => this.handleUndo(),
      onResetSelection: () => this.handleResetSelection(),
      onDownload: () => this.handleOpenDownload(),
      onIntensityChange: (level) => this.handleIntensityChange(level),
      onAdjustRadius: (delta) => this.handleAdjustRadius(delta),
      onSetRadius: (val) => this.handleSetRadius(val),
      onDeleteSelectedCircle: () => this.handleDeleteSelectedCircle()
    });

    this.imageUploader = new ImageUploader({
      dropzoneElement: this.dropzone,
      fileInputElement: document.getElementById('file-input'),
      importButton: document.getElementById('btn-import'),
      workspaceElement: document.getElementById('app-workspace'),
      onImageLoaded: this.handleImageLoaded.bind(this),
      onError: (msg) => this.notifications.show(msg, 'error'),
      shouldConfirmReplace: () => this.hasProcessed || this.faceSelector.circles.length > 0
    });

    this.exportModal = new ExportModal({
      modalElement: this.exportModalElement,
      onDownloadComplete: (name) => {
        this.notifications.show(`Fotografía "${name}" descargada con éxito.`, 'success');
      }
    });

    this.init();
  }

  init() {
    this.setupResizeObserver();
    this.setupPrivacyModal();
    this.updateUIState();

    // Show initial welcome advice
    setTimeout(() => {
      this.notifications.show('Importa una fotografía para comenzar a pixelar rostros.', 'info', 4000);
    }, 400);
  }

  setupResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
      if (this.currentImage) {
        this.renderViewport();
      }
    });
    resizeObserver.observe(this.viewportWrapper);
  }

  setupPrivacyModal() {
    const btnOpenPrivacy = document.getElementById('btn-info-privacy');
    const btnClosePrivacy = document.getElementById('btn-close-privacy');
    const btnPrivacyOk = document.getElementById('btn-privacy-ok');

    const open = () => {
      this.privacyModalElement.classList.add('modal-open');
      this.privacyModalElement.setAttribute('aria-hidden', 'false');
    };

    const close = () => {
      this.privacyModalElement.classList.remove('modal-open');
      this.privacyModalElement.setAttribute('aria-hidden', 'true');
    };

    if (btnOpenPrivacy) btnOpenPrivacy.addEventListener('click', open);
    if (btnClosePrivacy) btnClosePrivacy.addEventListener('click', close);
    if (btnPrivacyOk) btnPrivacyOk.addEventListener('click', close);
    this.privacyModalElement.addEventListener('click', (e) => {
      if (e.target === this.privacyModalElement) close();
    });
  }

  // --- Image Handling ---

  async handleImageLoaded(imgElement, fileInfo) {
    this.currentImage = imgElement;
    this.currentFileInfo = fileInfo;
    this.hasProcessed = false;

    // Setup master offscreen canvas at native dimensions
    this.masterCanvas.width = imgElement.naturalWidth;
    this.masterCanvas.height = imgElement.naturalHeight;
    this.masterCtx.clearRect(0, 0, this.masterCanvas.width, this.masterCanvas.height);
    this.masterCtx.drawImage(imgElement, 0, 0);

    // Initialize undo history with clean untouched state
    await this.historyManager.setInitialState(this.masterCanvas);

    // Clear any previous selection circles
    this.faceSelector.clearCircles();

    // Switch view from dropzone to active canvas container
    this.dropzone.style.display = 'none';
    this.canvasContainer.classList.remove('hidden');

    // Update meta details
    const fileSizeMb = (fileInfo.size / (1024 * 1024)).toFixed(2);
    this.imageMetaInfo.textContent = `${fileInfo.name} | ${imgElement.naturalWidth} × ${imgElement.naturalHeight} px | ${fileSizeMb} MB`;

    // Render viewport
    this.renderViewport();

    this.notifications.show(
      'Fotografía cargada. Haz clic sobre cada rostro que quieras pixelar.',
      'info',
      4500
    );
    this.updateUIState();
  }

  renderViewport() {
    if (!this.currentImage) return;

    const rect = this.viewportWrapper.getBoundingClientRect();
    const displayW = Math.max(10, Math.floor(rect.width));
    const displayH = Math.max(10, Math.floor(rect.height));

    const dpr = window.devicePixelRatio || 1;

    // Resize visible canvases with high-DPI crispness
    this.baseCanvas.width = displayW * dpr;
    this.baseCanvas.height = displayH * dpr;
    this.baseCanvas.style.width = `${displayW}px`;
    this.baseCanvas.style.height = `${displayH}px`;

    this.overlayCanvas.width = displayW * dpr;
    this.overlayCanvas.height = displayH * dpr;
    this.overlayCanvas.style.width = `${displayW}px`;
    this.overlayCanvas.style.height = `${displayH}px`;

    this.baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Update coordinate conversion helper
    this.coordHelper.update(
      displayW,
      displayH,
      this.masterCanvas.width,
      this.masterCanvas.height
    );

    // Render base image
    this.baseCtx.clearRect(0, 0, displayW, displayH);
    this.baseCtx.imageSmoothingEnabled = true;
    this.baseCtx.imageSmoothingQuality = 'high';

    this.baseCtx.drawImage(
      this.masterCanvas,
      0,
      0,
      this.masterCanvas.width,
      this.masterCanvas.height,
      this.coordHelper.offsetX,
      this.coordHelper.offsetY,
      this.coordHelper.renderedWidth,
      this.coordHelper.renderedHeight
    );

    // Render selection overlay
    this.faceSelector.render();
  }

  // --- Face Selection & Interaction ---

  handleSelectionChange(circles, selectedCircle, isFinal = true) {
    this.updateUIState();

    if (circles.length === 0) {
      this.helpBarMessage.textContent = 'Haz clic sobre cada rostro que quieras pixelar. Puedes seleccionar varias personas antes de aplicar los cambios.';
    } else {
      const count = circles.length;
      this.helpBarMessage.textContent = `${count} ${count === 1 ? 'rostro seleccionado' : 'rostros seleccionados'}. Pulsa "Pixelar seleccionados" para anonimizarlos.`;
    }
  }

  handleAdjustRadius(delta) {
    const selected = this.faceSelector.getSelectedCircle();
    if (selected) {
      this.faceSelector.adjustRadius(selected.id, delta);
    }
  }

  handleSetRadius(val) {
    const selected = this.faceSelector.getSelectedCircle();
    if (selected) {
      this.faceSelector.setCircleRadius(selected.id, val);
    }
  }

  handleDeleteSelectedCircle() {
    const selected = this.faceSelector.getSelectedCircle();
    if (selected) {
      this.faceSelector.removeCircle(selected.id);
      this.notifications.show('Círculo de selección eliminado.', 'info', 2000);
    }
  }

  handleResetSelection() {
    if (this.faceSelector.circles.length > 0) {
      this.faceSelector.clearCircles();
      this.notifications.show('Selección de rostros restablecida.', 'info', 2500);
      this.updateUIState();
    }
  }

  handleIntensityChange(levelKey) {
    // Intensity updated in toolbar; will be used on next pixelate
  }

  // --- Pixelation Execution ---

  async handlePixelate() {
    const circles = this.faceSelector.circles;
    if (!this.currentImage || circles.length === 0) {
      this.notifications.show('Selecciona al menos un rostro para continuar.', 'warning');
      return;
    }

    const isLargeImage = (this.masterCanvas.width * this.masterCanvas.height) > 6000000;
    if (isLargeImage) {
      this.processingOverlay.classList.remove('hidden');
    }

    // Allow UI to render spinner if needed
    await new Promise((resolve) => setTimeout(resolve, 30));

    try {
      // 1. Save current master canvas state to undo history
      await this.historyManager.push(this.masterCanvas);

      // 2. Apply real pixelation to master canvas
      const intensity = this.toolbar.getIntensity();
      applyPixelation(this.masterCanvas, circles, intensity);

      // 3. Update processing status
      this.hasProcessed = true;

      // 4. Clear the applied circles so the user sees the crisp pixelated result clearly
      // and can select new faces if desired
      this.faceSelector.clearCircles();

      // 5. Redraw base canvas
      this.renderViewport();

      this.notifications.show('Pixelado aplicado correctamente. La imagen está lista para descargar o seguir editando.', 'success', 3500);
    } catch (err) {
      console.error('Error applying pixelation:', err);
      this.notifications.show('Ocurrió un error al procesar el pixelado. Intenta de nuevo.', 'error');
    } finally {
      if (isLargeImage) {
        this.processingOverlay.classList.add('hidden');
      }
      this.updateUIState();
    }
  }

  // --- Undo ---

  async handleUndo() {
    if (!this.historyManager.canUndo()) return;

    const restored = await this.historyManager.undo(this.masterCanvas);
    if (restored) {
      this.hasProcessed = this.historyManager.canUndo();
      this.renderViewport();
      this.notifications.show('Último cambio de pixelado deshecho.', 'info', 2500);
      this.updateUIState();
    }
  }

  // --- Export & Download ---

  handleOpenDownload() {
    if (!this.currentImage) return;

    if (!this.hasProcessed) {
      const proceed = window.confirm(
        'Aviso: Todavía no has aplicado pixelado a ningún rostro en esta imagen. ¿Deseas descargarla de todas formas?'
      );
      if (!proceed) return;
    }

    this.exportModal.show(this.masterCanvas, this.currentFileInfo?.name || 'fotografia');
  }

  // --- UI State Sync ---

  updateUIState() {
    const hasImage = !!this.currentImage;
    const selectedCount = this.faceSelector.circles.length;
    const canUndo = this.historyManager.canUndo();
    const selectedCircle = this.faceSelector.getSelectedCircle();

    this.toolbar.updateState({
      hasImage,
      selectedCount,
      canUndo,
      hasProcessed: this.hasProcessed || canUndo,
      selectedCircle,
      minRadius: this.faceSelector.getMinRadius(),
      maxRadius: this.faceSelector.getMaxRadius()
    });
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FacePixelatorApp();
});
