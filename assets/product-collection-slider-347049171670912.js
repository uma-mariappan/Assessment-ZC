(() => {
  class ProductCollectionSlider extends HTMLElement {
    connectedCallback() {
      if (this.dataset.productCollectionReady === 'true') {
        return;
      }

      this.instances = Array.from(this.querySelectorAll('[data-product-collection-instance]'));
      if (!this.instances.length) {
        return;
      }

      this.onResize = this.onResize.bind(this);

      this.instances.forEach(function (instance) {
        this.bindInstance(instance);
      }.bind(this));

      window.addEventListener('resize', this.onResize);
      this.dataset.productCollectionReady = 'true';
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.onResize);
    }

    onResize() {
      this.instances.forEach(function (instance) {
        this.updateScrollbar(instance);
      }.bind(this));
    }

    bindInstance(instance) {
      if (!instance || instance.dataset.productCollectionBound === 'true') {
        return;
      }

      var track = instance.querySelector('[data-product-collection-track]');
      var prev = instance.querySelector('[data-product-collection-prev]');
      var next = instance.querySelector('[data-product-collection-next]');

      if (!track) {
        return;
      }

      track.addEventListener('scroll', function () {
        this.updateScrollbar(instance);
      }.bind(this));

      if (prev) {
        prev.addEventListener('click', function () {
          track.scrollBy({ left: -track.offsetWidth * 0.8, behavior: 'smooth' });
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          track.scrollBy({ left: track.offsetWidth * 0.8, behavior: 'smooth' });
        });
      }

      instance.dataset.productCollectionBound = 'true';
      this.updateScrollbar(instance);
    }

    updateScrollbar(instance) {
      if (!instance) {
        return;
      }

      var track = instance.querySelector('[data-product-collection-track]');
      var bar = instance.querySelector('[data-product-collection-scrollbar]');
      var thumb = instance.querySelector('[data-product-collection-scroll-thumb]');

      if (!track || !bar || !thumb) {
        return;
      }

      var maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);

      if (maxScroll <= 0) {
        bar.classList.add('hidden');
        return;
      }

      bar.classList.remove('hidden');

      var visibleRatio = track.clientWidth / track.scrollWidth;
      var thumbWidthPct = Math.max(visibleRatio * 100, 15);
      if (thumbWidthPct > 100) {
        thumbWidthPct = 100;
      }

      var scrollRatio = track.scrollLeft / maxScroll;
      var maxLeftPct = 100 - thumbWidthPct;
      var thumbLeftPct = scrollRatio * maxLeftPct;

      thumb.style.width = thumbWidthPct + '%';
      thumb.style.left = thumbLeftPct + '%';
    }
  }

  if (!customElements.get('product-collection-slider')) {
    customElements.define('product-collection-slider', ProductCollectionSlider);
}
})();
