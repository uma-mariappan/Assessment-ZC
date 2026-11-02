(() => {
  class BlogPostSlider extends HTMLElement {
    connectedCallback() {
      if (this.dataset.blogPostReady === 'true') {
        return;
      }

      this.instances = Array.from(this.querySelectorAll('[data-blog-post-instance]'));
      if (!this.instances.length) {
        return;
      }

      this.onResize = this.onResize.bind(this);

      this.instances.forEach(function (instance) {
        this.bindInstance(instance);
      }.bind(this));

      window.addEventListener('resize', this.onResize);
      this.dataset.blogPostReady = 'true';
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
      if (!instance || instance.dataset.blogPostBound === 'true') {
        return;
      }

      var track = instance.querySelector('[data-blog-post-track]');
      if (!track) {
        return;
      }

      track.addEventListener('scroll', function () {
        this.updateScrollbar(instance);
      }.bind(this));

      instance.dataset.blogPostBound = 'true';
      this.updateScrollbar(instance);
    }

    updateScrollbar(instance) {
      if (!instance) {
        return;
      }

      var track = instance.querySelector('[data-blog-post-track]');
      var bar = instance.querySelector('[data-blog-post-scrollbar]');
      var thumb = instance.querySelector('[data-blog-post-scroll-thumb]');

      if (!track || !thumb) {
        return;
      }

      var maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);

      if (maxScroll <= 0) {
        if (bar) {
          bar.classList.add('hidden');
        }
        return;
      }

      if (bar) {
        bar.classList.remove('hidden');
      }

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

  if (!customElements.get('blog-post-slider')) {
    customElements.define('blog-post-slider', BlogPostSlider);
  }
})();
