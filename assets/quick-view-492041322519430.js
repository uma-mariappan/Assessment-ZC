import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class QuickView extends HTMLElement {
    constructor() {
      super();
      this.lastTrigger = null;
      this.transitionMs = 200;
    }

    connectedCallback() {
      this.triggerButtons = this.querySelectorAll('[data-quick-view-button]');
      this.modal = this.querySelector('[data-quick-view-modal]');
      this.backdrop = this.querySelector('[data-quick-view-backdrop]');
      this.content = this.querySelector('[data-quick-view-content]');

      this.onTriggerClick = this.onTriggerClick.bind(this);
      this.handleClose = this.handleClose.bind(this);
      this.onOutsideClick = this.onOutsideClick.bind(this);
      this.onEscape = this.onEscape.bind(this);
      this.onModalKeydown = this.onModalKeydown.bind(this);

      this.triggerButtons.forEach((btn) => {
        btn.removeEventListener('click', this.onTriggerClick);
        btn.addEventListener('click', this.onTriggerClick);
      });

      this.modal?.addEventListener('click', this.onOutsideClick);
      document.addEventListener('keydown', this.onEscape);
    }

    onTriggerClick = async (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      this.lastTrigger = button;
      const productId = button?.dataset.productId || this.dataset.productId;
      if (!productId) {
        console.error('QuickView: missing productId');
        return;
      }
      this.content.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[400px]" aria-live="polite" aria-busy="true"><div class="qv-spinner" role="status" aria-label="Loading"></div></div>';
      this.open();

      try {
        const url = `/products/${productId}/quickview?${new URLSearchParams({ sections: 'product-quick-view' })}`;
        const response = await zcAdapter.fetch(url);
        if (!response.ok) {
          throw new Error(`QuickView API error: ${response.status}`);
        }

        const json = await response.json();
        const html = json?.sections?.['product-quick-view'];
        if (!html) {
          throw new Error('QuickView: no section HTML in response');
        }

        this.content.innerHTML = html;

        await this.initQuickViewContent(this.content);

        const closeBtn = this.content.querySelector('.quickViewClose');
        if (closeBtn) {
          closeBtn.removeEventListener('click', this.handleClose);
          closeBtn.addEventListener('click', this.handleClose);
        }

        requestAnimationFrame(() => {
          const focusables = this.getFocusables();
          if (focusables.length > 0) {
            focusables[0].focus();
          }
        });
      } catch (err) {
        console.error('QuickView failed to load:', err);
        this.content.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[400px] text-sm body-text-color">Failed to load. Please try again.</div>';
      }
    };

    async initQuickViewContent(container) {
      this.executeContentScripts(container);
      await this.waitForQuickViewComponents();
    }

    executeContentScripts(container) {
      container.querySelectorAll('script:not([type="application/json"])').forEach((old_script) => {
        const new_script = document.createElement('script');
        for (const attr of old_script.attributes) {
          new_script.setAttribute(attr.name, attr.value);
        }
        new_script.textContent = old_script.textContent;
        old_script.replaceWith(new_script);
      });
    }

    waitForQuickViewComponents() {
      const component_names = ['add-to-cart', 'request-quote', 'product-wishlist'];
      return Promise.all(
        component_names.map((name) => {
          if (customElements.get(name)) {
            return Promise.resolve();
          }
          return customElements.whenDefined(name).catch(() => {});
        })
      );
    }

    open() {
      if (!this.modal) {
        return;
      }
      document.body.style.overflow = 'hidden';
      this.hostCard = this.closest('[data-product]');
      this.hostCard?.classList.add('quick-view-active');
      this.modal.classList.remove('hidden');
      void this.modal.offsetWidth;
      this.modal.classList.add('is-open');
      this.modal.addEventListener('keydown', this.onModalKeydown);
    }

    handleClose = (options = {}) => {
      if (!this.modal) {
        return;
      }
      this.modal.classList.remove('is-open');
      this.hostCard?.classList.remove('quick-view-active');
      this.modal.removeEventListener('keydown', this.onModalKeydown);
      document.body.style.overflow = '';

      setTimeout(() => {
        if (!this.modal.classList.contains('is-open')) {
          this.modal.classList.add('hidden');
        }
      }, this.transitionMs);

      if (options.focusNextCard) {
        this.focusNextCard();
      } else if (this.lastTrigger) {
        this.lastTrigger.focus();
      }
    };

    onOutsideClick(e) {
      if (!this.content || !this.modal) {
        return;
      }
      if (!this.modal.classList.contains('is-open')) {
        return;
      }
      if (this.content.contains(e.target)) {
        return;
      }
      this.handleClose();
    }

    onEscape(e) {
      if (e.key === 'Escape' && this.modal && this.modal.classList.contains('is-open')) {
        this.handleClose();
      }
    }

    onModalKeydown(e) {
      if (e.key !== 'Tab') {
        return;
      }
      const focusables = this.getFocusables();
      if (focusables.length === 0) {
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        this.handleClose({ focusNextCard: true });
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    }

    getFocusables() {
      if (!this.modal) {
        return [];
      }
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');
      return Array.from(this.modal.querySelectorAll(selector)).filter((el) => {
        return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
      });
    }

    focusNextCard() {
      const currentCard = this.lastTrigger?.closest('[data-product]') || this.closest('[data-product]');
      if (!currentCard) {
        return;
      }
      const allCards = Array.from(document.querySelectorAll('[data-product]'));
      const idx = allCards.indexOf(currentCard);
      if (idx === -1) {
        return;
      }
      const nextCard = allCards[idx + 1];
      if (!nextCard) {
        this.lastTrigger?.focus();
        return;
      }
      const nextFocusable = nextCard.querySelector('a[href], button:not([disabled])');
      if (nextFocusable) {
        nextFocusable.focus();
      } else {
        this.lastTrigger?.focus();
      }
    }

    disconnectedCallback() {
      this.triggerButtons.forEach((btn) => {
        btn.removeEventListener('click', this.onTriggerClick);
      });
      this.modal?.removeEventListener('click', this.onOutsideClick);
      document.removeEventListener('keydown', this.onEscape);
      this.modal?.removeEventListener('keydown', this.onModalKeydown);

      const closeBtn = this.content?.querySelector('.quickViewClose');
      closeBtn?.removeEventListener('click', this.handleClose);
    }
  }

  if (!customElements.get('quick-view')) {
    customElements.define('quick-view', QuickView);
  }

  window.__pinkBeautyQuickViewClose = () => {
    document.querySelectorAll('quick-view').forEach((quick_view) => {
      if (quick_view.modal?.classList.contains('is-open') && typeof quick_view.handleClose === 'function') {
        quick_view.handleClose();
      }
    });
  };
})();
