/**
 * Face selection manager using an interactive overlay Canvas.
 * Handles circular selections, dragging, resizing, hit detection, and touch gestures.
 * All coordinates and radii are maintained in native image coordinates.
 */

export class FaceSelector {
  constructor(overlayCanvas, coordinateHelper, options = {}) {
    this.canvas = overlayCanvas;
    this.ctx = overlayCanvas.getContext('2d');
    this.coordHelper = coordinateHelper;

    this.circles = []; // Array of { id, x, y, radius }
    this.selectedId = null;

    this.onSelectionChange = options.onSelectionChange || (() => {});
    this.onCircleActivated = options.onCircleActivated || (() => {});

    // Interaction state
    this.dragState = null; // { mode: 'move'|'resize', circleId, startX, startY, origX, origY, origRadius }
    this.hoverState = null; // { type: 'handle'|'body'|'delete', circleId }

    this.isSelectionEnabled = true;
    this.defaultRadiusFactor = 0.08; // ~8% of smallest image dimension

    this.initEventListeners();
  }

  initEventListeners() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.handlePointerUp.bind(this));

    // Keyboard controls for fine-tuning
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  setSelectionEnabled(enabled) {
    this.isSelectionEnabled = enabled;
    this.canvas.style.pointerEvents = enabled ? 'auto' : 'none';
  }

  getDefaultRadius() {
    const minDim = Math.min(this.coordHelper.naturalWidth || 1000, this.coordHelper.naturalHeight || 1000);
    return Math.max(30, Math.round(minDim * this.defaultRadiusFactor));
  }

  getMinRadius() {
    const minDim = Math.min(this.coordHelper.naturalWidth || 1000, this.coordHelper.naturalHeight || 1000);
    return Math.max(12, Math.round(minDim * 0.02));
  }

  getMaxRadius() {
    const minDim = Math.min(this.coordHelper.naturalWidth || 1000, this.coordHelper.naturalHeight || 1000);
    return Math.round(minDim * 0.45);
  }

  // --- Pointer Handlers ---

  handlePointerDown(e) {
    if (!this.isSelectionEnabled || !this.coordHelper.naturalWidth) return;

    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const displayPos = { x: clientX - rect.left, y: clientY - rect.top };
    const imgPos = this.coordHelper.displayToImage(clientX, clientY, rect);

    if (!this.coordHelper.isPointInImageBounds(displayPos.x, displayPos.y)) {
      // Clicked outside image area
      this.selectedId = null;
      this.render();
      this.notifySelection();
      return;
    }

    const selectedCircle = this.getSelectedCircle();

    // 1. Check if clicked delete button of the currently selected circle
    if (selectedCircle) {
      const deleteHit = this.hitTestDeleteButton(selectedCircle, displayPos.x, displayPos.y);
      if (deleteHit) {
        this.removeCircle(selectedCircle.id);
        return;
      }

      // 2. Check if clicked resize handle of the currently selected circle
      const resizeHit = this.hitTestResizeHandle(selectedCircle, displayPos.x, displayPos.y);
      if (resizeHit) {
        this.canvas.setPointerCapture(e.pointerId);
        this.dragState = {
          mode: 'resize',
          circleId: selectedCircle.id,
          pointerId: e.pointerId,
          startImgX: imgPos.x,
          startImgY: imgPos.y,
          origRadius: selectedCircle.radius
        };
        return;
      }
    }

    // 3. Check if clicked any circle body (from topmost down)
    const hitCircle = this.hitTestCircles(imgPos.x, imgPos.y);
    if (hitCircle) {
      this.selectedId = hitCircle.id;
      this.canvas.setPointerCapture(e.pointerId);
      this.dragState = {
        mode: 'move',
        circleId: hitCircle.id,
        pointerId: e.pointerId,
        offsetX: imgPos.x - hitCircle.x,
        offsetY: imgPos.y - hitCircle.y
      };
      this.render();
      this.notifySelection();
      return;
    }

    // 4. Clicked blank area inside image -> create new circular selection
    const defaultRadius = this.getDefaultRadius();
    const newCircle = {
      id: 'face_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      x: Math.round(imgPos.x),
      y: Math.round(imgPos.y),
      radius: defaultRadius
    };

    // Clamp coordinates so circle fits within bounds
    newCircle.x = Math.max(newCircle.radius, Math.min(this.coordHelper.naturalWidth - newCircle.radius, newCircle.x));
    newCircle.y = Math.max(newCircle.radius, Math.min(this.coordHelper.naturalHeight - newCircle.radius, newCircle.y));

    this.circles.push(newCircle);
    this.selectedId = newCircle.id;

    this.render();
    this.notifySelection();
  }

  handlePointerMove(e) {
    if (!this.coordHelper.naturalWidth) return;

    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const displayPos = { x: clientX - rect.left, y: clientY - rect.top };
    const imgPos = this.coordHelper.displayToImage(clientX, clientY, rect);

    if (this.dragState) {
      const circle = this.circles.find((c) => c.id === this.dragState.circleId);
      if (!circle) return;

      if (this.dragState.mode === 'move') {
        const targetX = imgPos.x - this.dragState.offsetX;
        const targetY = imgPos.y - this.dragState.offsetY;

        // Keep center within image bounds
        circle.x = Math.max(0, Math.min(this.coordHelper.naturalWidth, Math.round(targetX)));
        circle.y = Math.max(0, Math.min(this.coordHelper.naturalHeight, Math.round(targetY)));
        this.render();
        this.notifySelection(false);
      } else if (this.dragState.mode === 'resize') {
        const dx = imgPos.x - circle.x;
        const dy = imgPos.y - circle.y;
        const newRadius = Math.round(Math.hypot(dx, dy));
        const clampedRadius = Math.max(this.getMinRadius(), Math.min(this.getMaxRadius(), newRadius));
        circle.radius = clampedRadius;
        this.render();
        this.notifySelection(false);
      }
      return;
    }

    // Update cursor depending on hover target
    this.updateHoverCursor(displayPos.x, displayPos.y, imgPos.x, imgPos.y);
  }

  handlePointerUp(e) {
    if (this.dragState) {
      try {
        this.canvas.releasePointerCapture(this.dragState.pointerId);
      } catch {
        // ignore if already released
      }
      this.dragState = null;
      this.render();
      this.notifySelection(true);
    }
  }

  handleKeyDown(e) {
    const selected = this.getSelectedCircle();
    if (!selected) return;

    // Delete or Backspace -> remove selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Avoid intercepting if an input is focused
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      e.preventDefault();
      this.removeCircle(selected.id);
      return;
    }

    // Escape -> deselect
    if (e.key === 'Escape') {
      this.selectedId = null;
      this.render();
      this.notifySelection();
      return;
    }

    // Arrow keys -> nudge position
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowUp') selected.y = Math.max(0, selected.y - step);
      if (e.key === 'ArrowDown') selected.y = Math.min(this.coordHelper.naturalHeight, selected.y + step);
      if (e.key === 'ArrowLeft') selected.x = Math.max(0, selected.x - step);
      if (e.key === 'ArrowRight') selected.x = Math.min(this.coordHelper.naturalWidth, selected.x + step);
      this.render();
      this.notifySelection();
      return;
    }

    // Plus/Minus -> resize radius
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      this.adjustRadius(selected.id, 5);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      this.adjustRadius(selected.id, -5);
    }
  }

  // --- Hit Testing ---

  hitTestCircles(imgX, imgY) {
    // Traverse in reverse order so topmost (latest) circle is picked first
    for (let i = this.circles.length - 1; i >= 0; i--) {
      const c = this.circles[i];
      const dist = Math.hypot(imgX - c.x, imgY - c.y);
      if (dist <= c.radius) {
        return c;
      }
    }
    return null;
  }

  hitTestResizeHandle(circle, displayX, displayY) {
    const disp = this.coordHelper.imageToDisplay(circle.x, circle.y, circle.radius);
    // Handle is placed at 45 degrees or 0 degrees (right edge)
    const angle = Math.PI / 4; // bottom-right
    const hx = disp.x + disp.radius * Math.cos(angle);
    const hy = disp.y + disp.radius * Math.sin(angle);
    const dist = Math.hypot(displayX - hx, displayY - hy);
    return dist <= 16; // 16px touch-friendly hit radius
  }

  hitTestDeleteButton(circle, displayX, displayY) {
    const disp = this.coordHelper.imageToDisplay(circle.x, circle.y, circle.radius);
    // Delete button placed at top-right (angle -45 deg)
    const angle = -Math.PI / 4;
    const bx = disp.x + disp.radius * Math.cos(angle);
    const by = disp.y + disp.radius * Math.sin(angle);
    const dist = Math.hypot(displayX - bx, displayY - by);
    return dist <= 14;
  }

  updateHoverCursor(dispX, dispY, imgX, imgY) {
    const selected = this.getSelectedCircle();
    if (selected) {
      if (this.hitTestDeleteButton(selected, dispX, dispY)) {
        this.canvas.style.cursor = 'pointer';
        return;
      }
      if (this.hitTestResizeHandle(selected, dispX, dispY)) {
        this.canvas.style.cursor = 'nwse-resize';
        return;
      }
    }

    const hitCircle = this.hitTestCircles(imgX, imgY);
    if (hitCircle) {
      this.canvas.style.cursor = 'grab';
    } else if (this.coordHelper.isPointInImageBounds(dispX, dispY)) {
      this.canvas.style.cursor = 'crosshair';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  // --- Circle Manipulations ---

  getSelectedCircle() {
    return this.circles.find((c) => c.id === this.selectedId) || null;
  }

  removeCircle(id) {
    this.circles = this.circles.filter((c) => c.id !== id);
    if (this.selectedId === id) {
      this.selectedId = this.circles.length > 0 ? this.circles[this.circles.length - 1].id : null;
    }
    this.render();
    this.notifySelection();
  }

  clearCircles() {
    this.circles = [];
    this.selectedId = null;
    this.render();
    this.notifySelection();
  }

  adjustRadius(id, delta) {
    const circle = this.circles.find((c) => c.id === id);
    if (!circle) return;
    const newR = Math.max(this.getMinRadius(), Math.min(this.getMaxRadius(), circle.radius + delta));
    circle.radius = newR;
    this.render();
    this.notifySelection();
  }

  setCircleRadius(id, radius) {
    const circle = this.circles.find((c) => c.id === id);
    if (!circle) return;
    circle.radius = Math.max(this.getMinRadius(), Math.min(this.getMaxRadius(), Math.round(radius)));
    this.render();
    this.notifySelection();
  }

  notifySelection(finalChange = true) {
    this.onSelectionChange(this.circles, this.getSelectedCircle(), finalChange);
  }

  // --- Rendering Overlays ---

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.coordHelper.naturalWidth || this.circles.length === 0) {
      return;
    }

    // Render unselected circles first, then selected circle on top
    const unselected = this.circles.filter((c) => c.id !== this.selectedId);
    const selected = this.getSelectedCircle();

    unselected.forEach((circle, index) => {
      const idx = this.circles.indexOf(circle) + 1;
      this.drawCircle(circle, false, idx);
    });

    if (selected) {
      const idx = this.circles.indexOf(selected) + 1;
      this.drawCircle(selected, true, idx);
    }
  }

  drawCircle(circle, isSelected, index) {
    const ctx = this.ctx;
    const disp = this.coordHelper.imageToDisplay(circle.x, circle.y, circle.radius);
    const { x, y, radius } = disp;

    ctx.save();

    // 1. Dual-tone outer contrast ring so outline is clearly visible on any photo
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)'; // Dark outline
    ctx.stroke();

    // 2. Inner crisp stroke with vibrant color
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.lineWidth = isSelected ? 2.5 : 2;
    ctx.strokeStyle = isSelected ? '#38bdf8' : '#e0e7ff'; // Cyan if selected, light violet if unselected
    if (!isSelected) {
      ctx.setLineDash([6, 5]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Subtle translucent fill
    ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(99, 102, 241, 0.08)';
    ctx.fill();

    // 4. Center indicator
    ctx.beginPath();
    ctx.arc(x, y, isSelected ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#38bdf8' : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Index badge pill at top
    const badgeText = `${index}`;
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    const textWidth = ctx.measureText(badgeText).width;
    const badgeW = Math.max(22, textWidth + 12);
    const badgeH = 20;
    const badgeX = x - badgeW / 2;
    const badgeY = y - radius - badgeH - 4;

    // Badge background
    ctx.fillStyle = isSelected ? '#0284c7' : 'rgba(30, 41, 59, 0.88)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Badge text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, x, badgeY + badgeH / 2);

    // 6. If selected: render resize handle and delete button
    if (isSelected) {
      // Resize handle at bottom-right (angle 45 deg)
      const angle = Math.PI / 4;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);

      // Handle circle
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();

      // Delete button at top-right (angle -45 deg)
      const delAngle = -Math.PI / 4;
      const dx = x + radius * Math.cos(delAngle);
      const dy = y + radius * Math.sin(delAngle);

      ctx.beginPath();
      ctx.arc(dx, dy, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw 'X' inside delete button
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx - 4, dy - 4);
      ctx.lineTo(dx + 4, dy + 4);
      ctx.moveTo(dx + 4, dy - 4);
      ctx.lineTo(dx - 4, dy + 4);
      ctx.stroke();
    }

    ctx.restore();
  }
}
