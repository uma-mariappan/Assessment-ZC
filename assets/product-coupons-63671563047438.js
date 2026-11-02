import { zcAdapter } from './network-adapter-730892702895239.js';

(() => {
  class ProductCoupons extends HTMLElement {
    connectedCallback() {
      this.couponList = this.querySelector('[data-coupon-list]');
      this.productIdValue = this.resolveProductId();

      if (!this.productIdValue || !this.couponList) {
        return;
      }

      this.getCouponsList(this.productIdValue)
        .then((raw) => {
          const couponsList = Array.isArray(raw) ? raw : raw && Array.isArray(raw.coupons) ? raw.coupons : [];
          if (couponsList.length > 0) {
            this.showCouponsUi();
            this.renderCoupons(couponsList);
          } else {
            this.hideEmptyCouponsUi();
          }
        })
        .catch(() => {
          this.hideEmptyCouponsUi();
        });
    }

    resolveProductId() {
      const fromHost =
        this.getAttribute('zcs-product-id') ||
        this.getAttribute('data-product-id') ||
        this.dataset.productId;

      if (fromHost) {
        return String(fromHost).trim();
      }

      const fromChild = this.querySelector('[data-product-id]')?.getAttribute('data-product-id');
      if (fromChild) {
        return String(fromChild).trim();
      }

      if (window.product_data?.id) {
        return String(window.product_data.id).trim();
      }

      const match = window.location.pathname.match(/\/products\/([^/?#]+)/);
      return match ? match[1] : '';
    }

    hideEmptyCouponsUi() {
      const slot = this.closest('[data-pdp-coupons-slot]');
      if (slot) {
        slot.classList.add('hidden');
      } else {
        this.classList.add('hidden');
      }
    }

    showCouponsUi() {
      const slot = this.closest('[data-pdp-coupons-slot]');
      if (slot) {
        slot.classList.remove('hidden');
      } else {
        this.classList.remove('hidden');
      }
    }

    getCouponsList(productIdValue) {
      return zcAdapter
        .fetch(`/products/${encodeURIComponent(productIdValue)}/coupons`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          this.couponData = data;
          return data;
        });
    }

    renderCoupons(couponsList) {
      couponsList.forEach((coupon) => {
        const couponCode = coupon.coupon_codes?.[0]?.coupon_code;
        const discountLabel = `Get ${coupon.discount_value_formatted} off`;

        const card = document.createElement('div');
        card.className = 'rounded-lg border border-dashed px-3 py-3';
        card.style.borderColor = 'var(--color-border)';
        card.style.backgroundColor = 'var(--color-surface, #F2E6EA)';

        const topRow = document.createElement('div');
        topRow.className = 'flex flex-wrap items-center gap-3';

        if (coupon.description) {
          const descSpan = document.createElement('span');
          descSpan.className = 'text-xs md:text-sm';
          descSpan.style.color = 'var(--color-text-muted)';
          descSpan.textContent = coupon.description;
          topRow.appendChild(descSpan);
        }

        const discountSpan = document.createElement('span');
        discountSpan.className = 'text-xs md:text-sm font-semibold';
        discountSpan.style.color = 'var(--color-primary)';
        discountSpan.textContent = discountLabel;
        topRow.appendChild(discountSpan);

        card.appendChild(topRow);

        if (couponCode) {
          const bottomRow = document.createElement('div');
          bottomRow.className = 'mt-2';

          const codeText = document.createElement('span');
          codeText.className = 'text-xs md:text-sm font-bold tracking-wide body-text-color';
          codeText.textContent = `Code: ${couponCode}`;

          bottomRow.appendChild(codeText);
          card.appendChild(bottomRow);
        }

        this.couponList.appendChild(card);
      });
    }
  }

  if (!customElements.get('product-coupons')) {
    customElements.define('product-coupons', ProductCoupons);
  }
})();
