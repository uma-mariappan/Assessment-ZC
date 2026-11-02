(() => {
  class BeforeAfterComparison extends HTMLElement {
    constructor() {
      super();
      this.isDragging = false;
      this.currentPosition = 50;
      this.containerRect = null;

      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);
    }

    connectedCallback() {
      this.divider = this.querySelector('.comparison-divider');
      this.handle = this.querySelector('.comparison-handle');
      this.beforeImage = this.querySelector('.comparison-image-before');
      this.afterImage = this.querySelector('.comparison-image-after');

      if (!this.divider || !this.handle || !this.beforeImage || !this.afterImage) {
        return;
      }

      this.updateClipPath(this.currentPosition);

      // Only listen for pointerdown on the divider (handle + line), NOT on the whole component
      this.divider.addEventListener('pointerdown', this.onPointerDown);
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);

      this.beforeImage.draggable = false;
      this.afterImage.draggable = false;
    }

    disconnectedCallback() {
      if (this.divider) {
        this.divider.removeEventListener('pointerdown', this.onPointerDown);
      }
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
    }

    onPointerDown(e) {
      if (e.button !== 0 && e.pointerType === 'mouse') {
        return;
      }

      e.preventDefault();
      this.isDragging = true;

      // Capture pointer on the divider so drag continues outside
      this.divider.setPointerCapture(e.pointerId);

      this.containerRect = this.getBoundingClientRect();
      this.handleDrag(e.clientX);
    }

    onPointerMove(e) {
      if (!this.isDragging) {
        return;
      }
      e.preventDefault();
      this.handleDrag(e.clientX);
    }

    onPointerUp(e) {
      if (!this.isDragging) {
        return;
      }

      this.isDragging = false;
      this.containerRect = null;

      try {
        this.divider.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    handleDrag(clientX) {
      if (!this.containerRect) {
        return;
      }

      var relativeX = clientX - this.containerRect.left;
      var percentage = Math.max(
        0,
        Math.min(100, (relativeX / this.containerRect.width) * 100)
      );

      this.currentPosition = percentage;
      this.updateClipPath(percentage);
    }

    updateClipPath(percentage) {
      // After (clear skin) clips from left — shows right portion from divider
      this.afterImage.style.clipPath = 'inset(0 0 0 ' + percentage + '%)';
      // Before (not-clear skin) is the base — no clipping needed
      this.divider.style.left = percentage + '%';
    }
  }

  if (!customElements.get('before-after-comparison')) {
    customElements.define('before-after-comparison', BeforeAfterComparison);
}
})();
