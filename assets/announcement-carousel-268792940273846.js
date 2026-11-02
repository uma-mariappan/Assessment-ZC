(() => {
  class AnnouncementCarousel extends HTMLElement {
      constructor() {
          super();
          this.currentIndex = 0;
          this.carousel = this.querySelector('#announcement-carousel');
          this.autoplaySpeed = Number(this.getAttribute('data-autoplay-speed')) || 3000;
          this.carouselInterval = null;
          this.resizeObserver = null;
      }

      connectedCallback() {
          if (!this.carousel) {
              return;
          }

          this.slides = Array.from(this.carousel.children);
          this.totalSlides = this.slides.length;

          if (this.totalSlides === 0) {
              return;
          }

          this.initializeCarousel();
          if (this.totalSlides > 1) {
              this.startAutoPlay();
          }

          this.applyHeaderOffset();
          this.observeBarResize();
          this.bindCloseButton();
      }

      showSlide(index) {
          this.slides.forEach((slide, i) => {
              if (i === index) {
                  slide.classList.remove('opacity-0');
                  slide.classList.add('opacity-100');
              } else {
                  slide.classList.add('opacity-0');
                  slide.classList.remove('opacity-100');
              }
          });
      }

      initializeCarousel() {
          this.currentIndex = 0;
          this.showSlide(0);
      }

      startAutoPlay() {
          if (this.carouselInterval) {
              clearInterval(this.carouselInterval);
          }
          this.carouselInterval = setInterval(() => this.nextSlide(), this.autoplaySpeed);
      }

      nextSlide() {
          if (this.totalSlides <= 1) {
              return;
          }
          this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
          this.showSlide(this.currentIndex);
      }

      applyHeaderOffset() {
          const run = () => {
              const bar = document.getElementById('header-announcement-bar');
              const appHeader = document.querySelector('app-header');
              if (!bar || !appHeader) {
                  return;
              }

              const height = bar.offsetHeight;
              if (height === 0) {
                  return;
              }
              document.documentElement.style.setProperty('--announcement-bar-height', `${height}px`);
              appHeader.style.top = `${height}px`;
              appHeader.updateSpacerHeight?.();
          };

          if (document.readyState === 'complete') {
              requestAnimationFrame(run);
          } else {
              window.addEventListener('load', () => requestAnimationFrame(run), { once: true });
          }
      }

      bindCloseButton() {
          const btn = document.getElementById('announcementBarClose');
          if (!btn) {
              return;
          }

          btn.addEventListener('click', () => {
              const bar = document.getElementById('header-announcement-bar');
              const appHeader = document.querySelector('app-header');

              if (bar) {
                  bar.classList.add('is-closing');
              }

              document.documentElement.style.setProperty('--announcement-bar-height', '0px');

              if (appHeader) {
                  appHeader.style.top = '0px';
                  appHeader.updateSpacerHeight?.();
              }

              if (this.carouselInterval) {
                  clearInterval(this.carouselInterval);
                  this.carouselInterval = null;
              }

              if (this.resizeObserver) {
                  this.resizeObserver.disconnect();
                  this.resizeObserver = null;
              }

              setTimeout(() => {
                  if (bar) {
                      bar.style.display = 'none';
                  }
              }, 300);
          });
      }

      observeBarResize() {
          const bar = document.getElementById('header-announcement-bar');
          if (!bar || typeof ResizeObserver === 'undefined') {
              return;
          }
          this.resizeObserver = new ResizeObserver(() => this.applyHeaderOffset());
          this.resizeObserver.observe(bar);
      }

      disconnectedCallback() {
          if (this.carouselInterval) {
              clearInterval(this.carouselInterval);
              this.carouselInterval = null;
          }
          if (this.resizeObserver) {
              this.resizeObserver.disconnect();
              this.resizeObserver = null;
          }
      }
  }

  if (!customElements.get('announcement-carousel')) {
    customElements.define('announcement-carousel', AnnouncementCarousel);
}
})();
