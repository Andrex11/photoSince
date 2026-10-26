/**
 * Modal dialog for exporting/downloading the final anonymized image.
 * Exports strictly using native resolution Canvas without any selection overlays.
 */

export class ExportModal {
  constructor(options = {}) {
    this.modalElement = options.modalElement;
    this.onDownloadComplete = options.onDownloadComplete || (() => {});
    this.init();
  }

  init() {
    if (!this.modalElement) return;

    this.btnClose = this.modalElement.querySelector('.modal-close');
    this.btnCancel = this.modalElement.querySelector('#btn-export-cancel');
    this.btnConfirm = this.modalElement.querySelector('#btn-export-confirm');
    this.radioPng = this.modalElement.querySelector('#export-format-png');
    this.radioJpeg = this.modalElement.querySelector('#export-format-jpeg');
    this.jpegQualityGroup = this.modalElement.querySelector('#jpeg-quality-group');
    this.sliderJpegQuality = this.modalElement.querySelector('#jpeg-quality-slider');
    this.labelJpegQuality = this.modalElement.querySelector('#jpeg-quality-val');
    this.fileNameInput = this.modalElement.querySelector('#export-filename');
    this.infoDimensions = this.modalElement.querySelector('#export-info-dimensions');

    // Event listeners
    if (this.btnClose) this.btnClose.addEventListener('click', () => this.hide());
    if (this.btnCancel) this.btnCancel.addEventListener('click', () => this.hide());

    if (this.modalElement) {
      this.modalElement.addEventListener('click', (e) => {
        if (e.target === this.modalElement) this.hide();
      });
    }

    if (this.radioPng && this.radioJpeg) {
      const toggleQuality = () => {
        const isJpeg = this.radioJpeg.checked;
        if (this.jpegQualityGroup) {
          this.jpegQualityGroup.style.display = isJpeg ? 'block' : 'none';
        }
        this.updateExtension();
      };
      this.radioPng.addEventListener('change', toggleQuality);
      this.radioJpeg.addEventListener('change', toggleQuality);
    }

    if (this.sliderJpegQuality && this.labelJpegQuality) {
      this.sliderJpegQuality.addEventListener('input', (e) => {
        this.labelJpegQuality.textContent = `${e.target.value}%`;
      });
    }

    if (this.btnConfirm) {
      this.btnConfirm.addEventListener('click', () => this.handleDownload());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
  }

  updateExtension() {
    if (!this.fileNameInput) return;
    const isJpeg = this.radioJpeg && this.radioJpeg.checked;
    const targetExt = isJpeg ? '.jpg' : '.png';
    let currentName = this.fileNameInput.value.trim();
    currentName = currentName.replace(/\.(png|jpe?g|webp)$/i, '');
    this.fileNameInput.value = (currentName || 'fotografia_pixelada') + targetExt;
  }

  show(masterCanvas, originalFileName = 'fotografia') {
    this.masterCanvas = masterCanvas;
    this.originalFileName = originalFileName;

    if (this.infoDimensions && masterCanvas) {
      this.infoDimensions.textContent = `${masterCanvas.width} × ${masterCanvas.height} px (Resolución nativa completa)`;
    }

    const baseName = originalFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const defaultName = `${baseName || 'fotografia'}_pixelada.png`;
    if (this.fileNameInput) {
      this.fileNameInput.value = defaultName;
    }

    if (this.radioPng) this.radioPng.checked = true;
    if (this.jpegQualityGroup) this.jpegQualityGroup.style.display = 'none';

    this.modalElement.classList.add('modal-open');
    this.modalElement.setAttribute('aria-hidden', 'false');
  }

  hide() {
    this.modalElement.classList.remove('modal-open');
    this.modalElement.setAttribute('aria-hidden', 'true');
  }

  isVisible() {
    return this.modalElement && this.modalElement.classList.contains('modal-open');
  }

  handleDownload() {
    if (!this.masterCanvas) return;

    const isJpeg = this.radioJpeg && this.radioJpeg.checked;
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
    const quality = isJpeg ? (parseInt(this.sliderJpegQuality?.value || 92, 10) / 100) : 1.0;

    let fileName = this.fileNameInput ? this.fileNameInput.value.trim() : 'fotografia_pixelada.png';
    if (!fileName) {
      fileName = isJpeg ? 'fotografia_pixelada.jpg' : 'fotografia_pixelada.png';
    }

    // Export canvas directly at 100% native resolution
    this.masterCanvas.toBlob(
      (blob) => {
        if (!blob) {
          alert('No se pudo generar la imagen para descargar.');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1500);

        this.hide();
        this.onDownloadComplete(fileName);
      },
      mimeType,
      quality
    );
  }
}
