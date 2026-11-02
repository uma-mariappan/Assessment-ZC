(() => {
  class ProductDetailsTabs extends HTMLElement {
    connectedCallback() {
      this.buttons = [...this.querySelectorAll('[data-product-tab-btn]')];
      this.contents = [...this.querySelectorAll('[data-product-tab-content]')];
      this.accordionHeaders = [...this.querySelectorAll('[data-accordion-header]')];
      this.stickyAddToCartBtn = this.querySelector('[data-sticky-add-to-cart]');
      this.stickyAddText = this.stickyAddToCartBtn?.querySelector('[data-sticky-add-text]');
      this.stickyOutText = this.stickyAddToCartBtn?.querySelector('[data-sticky-out-text]');
      this.stickyLoadingText = this.stickyAddToCartBtn?.querySelector('[data-sticky-loading-text]');

      this.buttons.forEach((button) => {
        button.addEventListener('click', this.onTabClick);
      });

      this.accordionHeaders.forEach((header) => {
        header.addEventListener('click', this.onAccordionToggle);
      });

      this.stickyAddToCartBtn?.addEventListener('click', this.onStickyAddToCart);

      this.setActiveTab('description');
      this.observeMainAddToCart();
    }

    disconnectedCallback() {
      this.buttons.forEach((button) => {
        button.removeEventListener('click', this.onTabClick);
      });

      this.accordionHeaders.forEach((header) => {
        header.removeEventListener('click', this.onAccordionToggle);
      });

      this.stickyAddToCartBtn?.removeEventListener('click', this.onStickyAddToCart);
      this.mainAddToCartObserver?.disconnect();
      this.stickyLoadingObserver?.disconnect();
    }

    observeMainAddToCart = () => {
      if (!this.stickyAddToCartBtn) {
        return;
      }

      const findMainBtn = () =>
        document.querySelector('[data-product-detail-page] [data-add-to-cart]') ||
        document.querySelector('[data-add-to-cart]');

      const sync = () => {
        const mainBtn = findMainBtn();
        if (!mainBtn) {
          return;
        }
        const available = !mainBtn.classList.contains('hidden');
        this.stickyAddToCartBtn.disabled = !available;
        this.stickyAddText?.classList.toggle('hidden', !available);
        this.stickyOutText?.classList.toggle('hidden', available);
      };

      sync();

      requestAnimationFrame(sync);

      const mainBtn = findMainBtn();
      if (!mainBtn) {
        return;
      }
      this.mainAddToCartObserver = new MutationObserver(sync);
      this.mainAddToCartObserver.observe(mainBtn, { attributes: true, attributeFilter: ['class'] });
    };

    onTabClick = (event) => {
      const tab = event.currentTarget.getAttribute('data-tab-target');
      this.setActiveTab(tab);
    };

    setActiveTab(tabName) {
      this.buttons.forEach((button) => {
        const isActive = button.getAttribute('data-tab-target') === tabName;
        button.classList.toggle('text-[#7F0D2E]', isActive);
        button.classList.toggle('font-semibold', isActive);
        button.classList.toggle('border-[#7F0D2E]', isActive);
        button.classList.toggle('text-[#1F1F1F]', !isActive);
        button.classList.toggle('border-transparent', !isActive);
      });

      this.contents.forEach((content) => {
        const isActive = content.getAttribute('data-product-tab-content') === tabName;
        content.classList.toggle('hidden', !isActive);
      });
    }

    onAccordionToggle = (event) => {
      const header = event.currentTarget;
      const content = header.parentElement?.querySelector('[data-accordion-content]');
      const arrow = header.querySelector('[data-accordion-arrow]');

      if (!content) return;

      const isOpen = content.classList.contains('opacity-100');

      if (isOpen) {
        content.style.maxHeight = '0px';
        content.classList.remove('opacity-100');
        content.classList.add('opacity-0');
        arrow?.classList.remove('rotate-180');
        return;
      }

      content.style.maxHeight = `${content.scrollHeight}px`;
      content.classList.remove('opacity-0');
      content.classList.add('opacity-100');
      arrow?.classList.add('rotate-180');
    };

    onStickyAddToCart = () => {
      if (this.stickyAddToCartBtn?.disabled) {
        return;
      }
      const addToCartButton =
        document.querySelector('[data-product-detail-page] [data-quantity] [data-add-to-cart]:not(.hidden)') ||
        document.querySelector('[data-product-detail-page] [data-add-to-cart]:not(.hidden)');

      if (!addToCartButton) {
        return;
      }

      this.setStickyLoading(true);
      this.stickyLoadingObserver?.disconnect();
      const mainSpinner = addToCartButton.querySelector('.spinner');
      if (mainSpinner) {
        this.stickyLoadingObserver = new MutationObserver(() => {
          if (mainSpinner.classList.contains('hidden')) {
            this.stickyLoadingObserver?.disconnect();
            this.setStickyLoading(false);
          }
        });
        this.stickyLoadingObserver.observe(mainSpinner, { attributes: true, attributeFilter: ['class'] });
      }

      addToCartButton.click();
    };

    setStickyLoading = (isLoading) => {
      if (!this.stickyAddToCartBtn) {
        return;
      }
      this.stickyAddToCartBtn.disabled = isLoading;
      this.stickyAddText?.classList.toggle('hidden', isLoading);
      this.stickyLoadingText?.classList.toggle('hidden', !isLoading);
    };
  }

  if (!customElements.get('product-details-tabs')) {
    customElements.define('product-details-tabs', ProductDetailsTabs);
}
})();
