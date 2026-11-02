import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class QuoteItems extends HTMLElement {
      constructor() {
          super();
          this.overlay = this.querySelector('[page-loader]');
          this.removeCartBtn = this.querySelectorAll('.btn-remove-items');
          this.cartDeleteIcons = this.querySelectorAll('.icon-delete');
      }

      connectedCallback() {
          const quantityCounters = this.querySelectorAll('quantity-counter');
          quantityCounters.forEach(counter => {
              counter.addEventListener('click', event => {
                  event.stopPropagation();
              });
              counter.addEventListener('quantity-data', event => {
                  const { data, variantId } = event.detail;
                  this.updateQuantity(data, variantId); 
              });
          });

          this.removeCartBtn.forEach(btn => {
              btn.addEventListener('click', event => {
                  this.removeCartItem(event.target);
              });
          });

          this.cartDeleteIcons.forEach(icon => {
              icon.addEventListener('click', event => {
                  const target = event.currentTarget;
                  this.removeCartItem(target);
              });
          });
          
          this.setCheckoutLinkWithQid();

      }

      setCheckoutLinkWithQid() {
          const zqid = this.getCookie("zqid");
          if (!zqid) return;

          const btn = document.querySelector('[data-request-quote-btn]');
          if (!btn) return;

          // Append ?checkout_id=qid
          const url = new URL(btn.href, window.location.origin);
          url.searchParams.set("checkout_id", zqid);
          btn.href = url.toString();
      }

      getCookie(name) {
          const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
          return match ? match[2] : null;
      }

      quoteVariantDetailId(variantID) {
          return variantID != null && variantID !== '' ? String(variantID) : null;
      }

      async updateQuantity(quantity, variantID) {
          this.setLoading();
          try {
              let formData = new FormData();
              formData.append('variant_id', variantID);
              formData.append('quantity', quantity);
              formData.append('sections', 'quote-page');
              const response = await zcAdapter.fetch('/quote/change', {
                  method: 'PUT',
                  body: formData
              });
              if (response.ok) {
                  const json = await response.json();
                  const parser = new DOMParser();
                  const cartPage = parser.parseFromString(json.sections['quote-page'], "text/html");
                  const cartPageContent = cartPage.querySelector('[data-quote-page]');
                  document.querySelector('[data-quote-page]').innerHTML = cartPageContent.innerHTML;
                  this.displayMessage(json.code, json.message);
                  if (typeof window.zcDispatchStorefrontEvent === 'function') {
                      const detail = {
                          code: json.code,
                          variantId: this.quoteVariantDetailId(variantID),
                          quantity,
                          source: 'quote-items',
                      };
                      window.zcDispatchStorefrontEvent(
                          json.code === 0 ? 'zc-quote-update-success' : 'zc-quote-update-error',
                          detail
                      );
                  }
              } else {
                  throw new Error(response.statusText);
              }

          } catch (e) {
              if (typeof window.zcDispatchStorefrontEvent === 'function') {
                  window.zcDispatchStorefrontEvent('zc-quote-update-error', {
                      variantId: this.quoteVariantDetailId(variantID),
                      quantity,
                      source: 'quote-items',
                  });
              }
          } finally {
              this.removeLoading();
          }
      }

      displayMessage(statusCode, message) {
          window.scrollTo({ top: 0, behavior: 'smooth' });

          const messageElement = document.querySelector('quantity-message');
          messageElement.classList.add('z-index-5');

          if (statusCode === 0) {
              messageElement.showSuccess(message);
          } else {
              messageElement.showError(message);
          }
      }

      async removeCartItem(event) {
          const variantID = event.dataset.removeVariantId;
          try {
              window.pushRemoveFromCartToAnalytics(variantID);
          } catch(error) {
              console.error('Cart page analytics failed:', error);
          }
          
          this.setLoading();
          try {
              let url = '/quote/change' + '?' + new URLSearchParams({
                  variant_id: variantID,
                  sections: 'quote-page'
              });
              const response = await zcAdapter.fetch(url, { method: 'DELETE' });
              if (response.ok) {
                  const json = await response.json();
                  document.querySelector('[data-quote-page]').innerHTML = json.sections['quote-page'];
                  document.querySelector('app-header')?.getQuoteCount();
                  this.displayMessage(json.code, json.message);
                  if (typeof window.zcDispatchStorefrontEvent === 'function') {
                      const detail = {
                          code: json.code,
                          variantId: this.quoteVariantDetailId(variantID),
                          source: 'quote-items',
                      };
                      window.zcDispatchStorefrontEvent(
                          json.code === 0 ? 'zc-quote-remove-success' : 'zc-quote-remove-error',
                          detail
                      );
                  }
              } else {
                  throw new Error(response.statusText);
              }
          } catch (e) {
              if (typeof window.zcDispatchStorefrontEvent === 'function') {
                  window.zcDispatchStorefrontEvent('zc-quote-remove-error', {
                      variantId: this.quoteVariantDetailId(variantID),
                      source: 'quote-items',
                  });
              }
          } finally {
              this.removeLoading();
          }
      }

      setLoading() {
          this.overlay.classList.remove('hidden');
      }

      removeLoading() {
          this.overlay.classList.add('hidden');
      }
  }

  if (!customElements.get('quote-items')) {
    customElements.define('quote-items', QuoteItems);
  }
})();
