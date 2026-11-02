(() => {
  /**
   * Hero Banner Carousel - handles slide scrolling, dot indicators, and autoplay
   */
  class HeroBannerCarousel extends HTMLElement {
    constructor() {
      super();
      this.currentIndex = 0;
      this.autoplayInterval = null;
      this.scrollSyncTimeout = null;
      this.isAdjustingPosition = false;
    }

    connectedCallback() {
      this.track = this.querySelector('.hero-carousel-track');
      this.dotsContainer = this.querySelector('.hero-carousel-dots');
      if (!this.track) return;

      this.slides = Array.from(this.track.querySelectorAll('.hero-carousel-slide'));
      this.dots = Array.from(this.querySelectorAll('.hero-carousel-dot'));
      this.totalSlides = this.slides.length;

      if (this.totalSlides <= 1) return;

      // Clone slides for infinite loop
      this.setupInfiniteLoop();

      this.autoplayEnabled = this.dataset.autoplay === 'true' || this.dataset.autoplay === true;
      var speedSec = parseInt(this.dataset.autoplaySpeed, 10);
      this.autoplayDelay = (speedSec >= 2 && speedSec <= 10 ? speedSec : 5) * 1000;

      // Start at the first real slide (after clone)
      // Use requestAnimationFrame to ensure DOM is ready
      var self = this;
      requestAnimationFrame(function() {
        self.jumpToRealSlide(0, false);
      });

      this.track.addEventListener('scroll', this.handleScroll);
      this.dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
          this.goToSlide(index);
        }.bind(this));
      }.bind(this));

      if (this.autoplayEnabled) {
        this.startAutoplay();
      }
    }

    setupInfiniteLoop() {
      // Clone last slide and prepend at start
      var lastSlide = this.slides[this.totalSlides - 1].cloneNode(true);
      lastSlide.classList.add('hero-carousel-clone');
      this.track.insertBefore(lastSlide, this.track.firstChild);

      // Clone first slide and append at end
      var firstSlide = this.slides[0].cloneNode(true);
      firstSlide.classList.add('hero-carousel-clone');
      this.track.appendChild(firstSlide);

      // Update slides array to include clones (re-query to get updated order)
      this.slides = Array.from(this.track.querySelectorAll('.hero-carousel-slide'));
    }

    jumpToRealSlide(index, smooth) {
      if (index < 0 || index >= this.totalSlides) return;
      var realSlide = this.slides[index + 1]; // +1 because first slide is clone
      if (realSlide) {
        this.isAdjustingPosition = true;
        this.track.scrollTo({
          left: realSlide.offsetLeft,
          behavior: smooth ? 'smooth' : 'auto'
        });
        this.setActiveIndex(index);
        var self = this;
        setTimeout(function() {
          self.isAdjustingPosition = false;
        }, smooth ? 500 : 50);
      }
    }

    handleScroll = () => {
      if (this.isAdjustingPosition) return;

      const index = this.getNearestDomIndex();
      if (index === 0) {
        this.setActiveIndex(this.totalSlides - 1);
      } else if (index === this.slides.length - 1) {
        this.setActiveIndex(0);
      } else {
        this.setActiveIndex(index - 1);
      }

      if (this.scrollSyncTimeout) clearTimeout(this.scrollSyncTimeout);
      this.scrollSyncTimeout = setTimeout(this.syncFromScroll, 120);
    };

    syncFromScroll = () => {
      if (this.isAdjustingPosition) return;

      const index = this.getNearestDomIndex();
      if (index === 0) {
        this.jumpToDomIndex(this.totalSlides, false); // last real slide
        return;
      } else if (index === this.slides.length - 1) {
        this.jumpToDomIndex(1, false); // first real slide
        return;
      }

      this.setActiveIndex(index - 1);
    };

    getNearestDomIndex() {
      const slideWidth = this.track.offsetWidth || 1;
      return Math.round(this.track.scrollLeft / slideWidth);
    }

    jumpToDomIndex(domIndex, smooth) {
      var targetSlide = this.slides[domIndex];
      if (!targetSlide) return;

      this.isAdjustingPosition = true;
      this.track.scrollTo({
        left: targetSlide.offsetLeft,
        behavior: smooth ? 'smooth' : 'auto'
      });

      var self = this;
      setTimeout(function() {
        self.isAdjustingPosition = false;
      }, smooth ? 500 : 50);
    }

    setActiveIndex(index) {
      this.currentIndex = index;
      this.dots.forEach(function (dot, i) {
        if (i === index) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    goToSlide(index) {
      if (index < 0 || index >= this.totalSlides) return;
      var targetDomIndex = index + 1;
      if (this.currentIndex === this.totalSlides - 1 && index === 0) {
        targetDomIndex = this.slides.length - 1; // appended first-slide clone
      }
      var targetSlide = this.slides[targetDomIndex];
      if (targetSlide) {
        this.isAdjustingPosition = true;
        this.track.scrollTo({
          left: targetSlide.offsetLeft,
          behavior: 'smooth'
        });
        this.setActiveIndex(index);
        this.resetAutoplay();
        var self = this;
        setTimeout(function() {
          self.isAdjustingPosition = false;
          self.syncFromScroll();
        }, 500);
      }
    }

    next() {
      // Always move forward - infinite loop handles wrapping
      var nextIndex = (this.currentIndex + 1) % this.totalSlides;
      this.goToSlide(nextIndex);
    }

    startAutoplay() {
      this.stopAutoplay();
      this.autoplayInterval = setInterval(() => {
        this.next();
      }, this.autoplayDelay);
    }

    stopAutoplay() {
      if (this.autoplayInterval) {
        clearInterval(this.autoplayInterval);
        this.autoplayInterval = null;
      }
    }

    resetAutoplay() {
      if (this.autoplayEnabled) {
        this.startAutoplay();
      }
    }

    disconnectedCallback() {
      this.stopAutoplay();
      if (this.scrollSyncTimeout) clearTimeout(this.scrollSyncTimeout);
      if (this.track) {
        this.track.removeEventListener('scroll', this.handleScroll);
      }
    }
  }

  if (!customElements.get('hero-banner-carousel')) {
    customElements.define('hero-banner-carousel', HeroBannerCarousel);
}
})();
