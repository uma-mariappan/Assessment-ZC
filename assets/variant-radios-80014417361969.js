(() => {
  class VariantRadios extends HTMLElement {
    connectedCallback() {
      this.optionGroups = [...this.querySelectorAll('[data-variant-group]')];
      this.variantTitle = this.querySelector('[data-variant-title]');
      this.variantAvailability = this.querySelector('[data-variant-availability]');
      this.variantSku = this.querySelector('[data-variant-sku]');
      this.inputVariantId = document.querySelector('[name="variant_id"]');
      this.addToCartBtn = document.querySelector('[data-add-to-cart]');
      this.outOfStockBtn = document.querySelector('[data-out-of-stock]');
      this.quantityBlock = document.querySelector('[data-quantity-block]') || document.querySelector('[data-product-detail-counter]');
      this.quotesEnabled = !!document.querySelector('request-quote');
      this.stickyAddToCartBtn = document.querySelector('[data-sticky-add-to-cart]');
      this.stickyAddText = this.stickyAddToCartBtn?.querySelector('[data-sticky-add-text]');
      this.stickyOutText = this.stickyAddToCartBtn?.querySelector('[data-sticky-out-text]');

      this.optionGroups.forEach((group) => {
        group.querySelectorAll('[data-variant-option]').forEach((option) => {
          option.addEventListener('click', this.onOptionClick);
        });
      });

      const currentVariant = this.getCurrentVariant() || this.getVariantData()[0];
      if (currentVariant) {
        if (this.inputVariantId) this.inputVariantId.value = currentVariant.id;
        this.updatePriceInUi(currentVariant);
        this.updateVariantDetails(currentVariant);
        this.checkVariantsAvailability();
      }
    }

    disconnectedCallback() {
      this.optionGroups.forEach((group) => {
        group.querySelectorAll('[data-variant-option]').forEach((option) => {
          option.removeEventListener('click', this.onOptionClick);
        });
      });
    }

    getVariantData = () => {
      return JSON.parse(this.querySelector('#productVariantsJson').textContent);
    };

    getSelectedValues = () => {
      return this.optionGroups.map((group) => group.querySelector('[data-selected-option]').value);
    };

    normalizeOptionValue = (value) => String(value || '').trim().toLowerCase();

    optionsEqual = (left, right) => {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
      return left.every((value, index) => this.normalizeOptionValue(value) === this.normalizeOptionValue(right[index]));
    };

    getCurrentVariant = () => {
      const selected = this.getSelectedValues();
      return this.getVariantData().find(
        (variant) => this.optionsEqual(variant.options, selected)
      );
    };

    onOptionClick = (event) => {
      const option = event.currentTarget;
      if (option.classList.contains('is-disabled')) return;

      const group = option.closest('[data-variant-group]');
      const selectedInput = group.querySelector('[data-selected-option]');
      const optionValue = option.getAttribute('data-option-value');

      selectedInput.value = optionValue;

      group
        .querySelectorAll('[data-variant-option]')
        .forEach((opt) => opt.classList.remove('is-selected'));
      option.classList.add('is-selected');

      this.updateCurrentVariant();
      this.checkVariantsAvailability();

      const currentVariant = this.getCurrentVariant();
      if (typeof window.zcDispatchStorefrontEvent === 'function') {
        window.zcDispatchStorefrontEvent('zc-product-attribute-select', {
          options: this.getSelectedValues(),
          variantId: currentVariant ? currentVariant.id : null,
          available: currentVariant ? !!currentVariant.available : null,
        });
      }
    };

    updateCurrentVariant = () => {
      const currentVariant = this.getCurrentVariant();
      if (!currentVariant) return;

      if (this.inputVariantId) this.inputVariantId.value = currentVariant.id;
      this.updatePriceInUi(currentVariant);
      this.updateVariantDetails(currentVariant);
      this.updateVariantImages(currentVariant);

      document.dispatchEvent(
        new CustomEvent('variant:changed', { detail: { variantId: currentVariant.id } })
      );

      const url = new URL(window.location.href);
      if (url.pathname.includes('/products')) {
        url.searchParams.set('variant', currentVariant.id);
        window.history.replaceState({}, '', url.toString());
      }
    };

    updateVariantImages = (currentVariant) => {
      if (!currentVariant) return;
      const container = this.closest('[data-quick-view]') || this.closest('[data-product-detail-page]');
      const productImagesComponent = container?.querySelector('product-images');
      if (productImagesComponent && typeof productImagesComponent.updateVariantImages === 'function') {
        const productData = window.product_data || {};
        productImagesComponent.updateVariantImages(currentVariant, productData);
      }
    };

    checkVariantsAvailability = () => {
      const variants = this.getVariantData();
      const selectedValues = this.getSelectedValues();

      this.optionGroups.forEach((group, groupIndex) => {
        const options = group.querySelectorAll('[data-variant-option]');

        options.forEach((option) => {
          const testValues = [...selectedValues];
          testValues[groupIndex] = option.getAttribute('data-option-value');

          const exists = variants.some((variant) => {
            return variant.options.every((value, index) => {
              if (index <= groupIndex) {
                return this.normalizeOptionValue(value) === this.normalizeOptionValue(testValues[index]);
              }
              return true;
            });
          });

          option.classList.toggle('is-disabled', !exists);
        });
      });
    };

    updateVariantDetails = (currentVariant) => {
      if (this.variantTitle) {
        this.variantTitle.textContent = currentVariant.title || '—';
      }

      if (this.variantAvailability) {
        const available = !!currentVariant.available;
        this.variantAvailability.textContent = available ? 'In stock' : 'Out of stock';
        this.variantAvailability.classList.toggle('text-green-700', available);
        this.variantAvailability.classList.toggle('text-red-600', !available);
      }

      if (this.variantSku) {
        const sku = String(currentVariant.sku || '').trim();
        this.variantSku.textContent = sku || '—';
      }
    };

    updatePriceInUi = (currentVariant) => {
      const container = this.closest('[data-product-detail-page]');
      const currentPrice = container?.querySelector('.currentPrice');
      const actualPrice = container?.querySelector('#actualPrice');

      if (currentPrice && currentVariant?.price !== undefined) {
        currentPrice.textContent = currentVariant.price_formatted;
      }

      if (actualPrice && currentVariant?.label_price !== undefined) {
        actualPrice.textContent =
          currentVariant.label_price > 0 ? currentVariant.label_price_formatted : '';
        actualPrice.classList.toggle('hidden', currentVariant.label_price <= 0);
      }

      if (this.addToCartBtn && this.outOfStockBtn) {
        if (currentVariant.available) {
          this.addToCartBtn.classList.remove('hidden');
          this.outOfStockBtn.classList.add('hidden');
          this.quantityBlock?.classList.remove('hidden');
        } else {
          this.addToCartBtn.classList.add('hidden');
          this.outOfStockBtn.classList.remove('hidden');
          if (this.quotesEnabled) {
            this.quantityBlock?.classList.remove('hidden');
          } else {
            this.quantityBlock?.classList.add('hidden');
          }
        }
      }

      if (this.stickyAddToCartBtn) {
        this.stickyAddToCartBtn.disabled = !currentVariant.available;
        this.stickyAddText?.classList.toggle('hidden', !currentVariant.available);
        this.stickyOutText?.classList.toggle('hidden', currentVariant.available);
      }
    };
  }

  if (!customElements.get('variant-radios')) {
    customElements.define('variant-radios', VariantRadios);
}
})();
