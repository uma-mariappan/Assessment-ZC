import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class RecommendedProducts extends HTMLElement {
    connectedCallback() {
      // Guard: only fetch once per element instance and never inside a parent that already fetched
      if (this.dataset.fetched === 'true') {
        return;
      }
      if (this.closest('recommended-products[data-fetched="true"]') && this.closest('recommended-products[data-fetched="true"]') !== this) {
        return;
      }

      this.dataset.fetched = 'true';

      this.productId = this.resolveProductId();
      if (!this.productId) {
        return;
      }
      this.fetchRecommendedProducts();
    }

    resolveProductId() {
      const fromAttr = this.dataset.productId;
      if (fromAttr) {
        return fromAttr;
      }

      if (window.product_data && window.product_data.id) {
        return window.product_data.id;
      }

      const match = window.location.pathname.match(/\/products\/([^/?#]+)/);
      return match ? match[1] : null;
    }

    async fetchRecommendedProducts() {
      try {
        const res = await zcAdapter.fetch(`/products/${this.productId}/recommendations?sections=recommended-products`);
        if (!res.ok) {
          throw new Error(`Recommendations API error! Status: ${res.status}`);
        }

        const data = await res.json();
        const hasRecommendations = data.recommendations && data.recommendations.length > 0;
        let html = data.sections && data.sections['recommended-products'];

        if (!html || !hasRecommendations) {
          if (typeof window.zcDispatchStorefrontEvent === 'function') {
            window.zcDispatchStorefrontEvent('zc-recommended-products-success', {
              productId: this.productId,
              productCount: 0,
              empty: true
            });
          }
          return;
        }

        const temp = document.createElement('div');
        temp.innerHTML = html;
        const innerWrapper = temp.querySelector('recommended-products');
        if (innerWrapper) {
          html = innerWrapper.innerHTML;
        }

        this.innerHTML = html;
        this.classList.remove('hidden');
        this.querySelectorAll('script[src]').forEach((s) => s.remove());
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          const cards = this.querySelectorAll('.product-card, [data-product-card], article').length;
          window.zcDispatchStorefrontEvent('zc-recommended-products-success', {
            productId: this.productId,
            productCount: cards,
            empty: false
          });
        }
      } catch (error) {
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent('zc-recommended-products-error', {
            productId: this.productId
          });
        }
      }
    }
  }

  if (!customElements.get('recommended-products')) {
    customElements.define('recommended-products', RecommendedProducts);
  }
})();
