/**
 * Handles image file selection, drag & drop, file type validation, and loading.
 */

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export class ImageUploader {
  constructor(options = {}) {
    this.dropzoneElement = options.dropzoneElement;
    this.fileInputElement = options.fileInputElement;
    this.importButton = options.importButton;
    this.workspaceElement = options.workspaceElement;
    this.onImageLoaded = options.onImageLoaded || (() => {});
    this.onError = options.onError || (() => {});
    this.shouldConfirmReplace = options.shouldConfirmReplace || (() => false);

    this.currentObjectUrl = null;
    this.init();
  }

  init() {
    // Hidden file input change
    if (this.fileInputElement) {
      this.fileInputElement.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.handleFile(file);
        }
        // Reset input value so re-selecting same file triggers change
        this.fileInputElement.value = '';
      });
    }

    // Import button click
    if (this.importButton) {
      this.importButton.addEventListener('click', () => {
        this.openFilePicker();
      });
    }

    // Dropzone click
    if (this.dropzoneElement) {
      this.dropzoneElement.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' || e.target.classList.contains('dropzone-browse-btn')) {
          this.openFilePicker();
        }
      });

      this.dropzoneElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openFilePicker();
        }
      });
    }

    // Setup Drag and Drop on both dropzone and full workspace
    this.setupDragAndDrop();
  }

  openFilePicker() {
    if (this.shouldConfirmReplace()) {
      const confirmReplace = window.confirm(
        'Ya tienes cambios en la imagen actual. ¿Deseas reemplazarla por una nueva fotografía? Los cambios no exportados se perderán.'
      );
      if (!confirmReplace) {
        return;
      }
    }

    if (this.fileInputElement) {
      this.fileInputElement.click();
    }
  }

  setupDragAndDrop() {
    const targets = [this.dropzoneElement, this.workspaceElement].filter(Boolean);

    targets.forEach((target) => {
      target.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        target.classList.add('drag-active');
      });

      target.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        target.classList.add('drag-active');
      });

      target.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only remove if leaving target itself
        if (e.relatedTarget && target.contains(e.relatedTarget)) return;
        target.classList.remove('drag-active');
      });

      target.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        target.classList.remove('drag-active');

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          if (this.shouldConfirmReplace()) {
            const confirmReplace = window.confirm(
              'Ya tienes cambios en la imagen actual. ¿Deseas reemplazarla por una nueva fotografía? Los cambios no exportados se perderán.'
            );
            if (!confirmReplace) return;
          }
          this.handleFile(files[0]);
        }
      });
    });

    // Prevent default browser file drop on entire window
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());
  }

  validateFile(file) {
    if (!file) return { valid: false, error: 'No se seleccionó ningún archivo.' };

    const extension = '.' + file.name.split('.').pop().toLowerCase();
    const isSupportedMime = SUPPORTED_MIME_TYPES.includes(file.type);
    const isSupportedExt = SUPPORTED_EXTENSIONS.includes(extension);

    if (!isSupportedMime && !isSupportedExt) {
      return {
        valid: false,
        error: `Formato de archivo no compatible ("${file.type || extension}"). Selecciona una imagen JPG, PNG o WebP.`
      };
    }

    return { valid: true };
  }

  async handleFile(file) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.onError(validation.error);
      return;
    }

    // Revoke previous URL if any
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }

    try {
      this.currentObjectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        this.onImageLoaded(img, {
          name: file.name,
          size: file.size,
          type: file.type,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
      };

      img.onerror = () => {
        this.onError('No se pudo procesar la imagen. El archivo puede estar dañado o no ser compatible.');
        if (this.currentObjectUrl) {
          URL.revokeObjectURL(this.currentObjectUrl);
          this.currentObjectUrl = null;
        }
      };

      img.src = this.currentObjectUrl;
    } catch {
      this.onError('Ocurrió un error al cargar la imagen. Intenta con otro archivo.');
    }
  }

  cleanup() {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }
}
