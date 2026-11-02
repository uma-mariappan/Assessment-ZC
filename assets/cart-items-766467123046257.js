import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class CartItems extends HTMLElement {
      constructor() {
          super();
          this.overlay = this.querySelector('[page-loader]') || document.querySelector('[page-loader]');
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
                  this.removeCartItem(event.currentTarget);
              });
          });

          this.cartDeleteIcons.forEach(icon => {
              icon.addEventListener('click', event => {
                  const target = event.currentTarget;
                  this.removeCartItem(target);
              });
          });
          

      }

      async updateQuantity(quantity, variantID) {
          this.setLoading();
          try {
              let formData = new FormData();
              formData.append('variant_id', variantID);
              formData.append('quantity', quantity);
              formData.append('sections', 'cart-page');
              const response = await zcAdapter.fetch('/cart/change', {
                  method: 'PUT',
                  body: formData
              });
              if (response.ok) {
                  const json = await response.json();
                  const parser = new DOMParser();
                  const cartPage = parser.parseFromString(json.sections['cart-page'], "text/html");
                  const cartPageContent = cartPage.querySelector('[data-cart-page]');
                  document.querySelector('[data-cart-page]').innerHTML = cartPageContent.innerHTML;
                  this.displayMessage(json.code, json.message);
                  if (typeof window.zcDispatchStorefrontEvent === 'function') {
                      const detail = {
                          changeType: quantity === 0 ? 'remove-line' : 'quantity-update',
                          code: json.code,
                          variantId: variantID,
                          delta: quantity,
                          source: 'cart-items',
                      };
                      window.zcDispatchStorefrontEvent(
                          json.code === 0 ? 'zc-cart-update-success' : 'zc-cart-update-error',
                          detail
                      );
                  }
              } else {
                  throw new Error(response.statusText);
              }

          } catch (err) {
              console.error('cart-items update:', err);
              if (typeof window.zcDispatchStorefrontEvent === 'function') {
                  window.zcDispatchStorefrontEvent('zc-cart-update-error', {
                      changeType: 'quantity-update',
                      variantId: variantID,
                      delta: quantity,
                      source: 'cart-items',
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

      async removeCartItem(target) {
          const variantID = target?.dataset?.removeVariantId;
          if (!variantID) {
              return;
          }
          try {
              window.pushRemoveFromCartToAnalytics(variantID);
          } catch(error) {
              console.error('Cart page analytics failed:', error);
          }
          
          this.setLoading();
          try {
              let url = '/cart/change' + '?' + new URLSearchParams({
                  variant_id: variantID,
                  sections: 'cart-page'
              });
              const response = await zcAdapter.fetch(url, { method: 'DELETE' });
              if (response.ok) {
                  const json = await response.json();
                  document.querySelector('[data-cart-page]').innerHTML = json.sections['cart-page'];
                  document.querySelector('app-header')?.getCartCall();
                  this.displayMessage(json.code, json.message);
                  if (typeof window.zcDispatchStorefrontEvent === 'function') {
                      const detail = {
                          changeType: 'remove-line',
                          code: json.code,
                          variantId: variantID,
                          source: 'cart-items',
                      };
                      window.zcDispatchStorefrontEvent(
                          json.code === 0 ? 'zc-cart-remove-success' : 'zc-cart-remove-error',
                          detail
                      );
                  }
              } else {
                  throw new Error(response.statusText);
              }
          } catch (err) {
              console.error('cart-items remove:', err);
              if (typeof window.zcDispatchStorefrontEvent === 'function') {
                  window.zcDispatchStorefrontEvent('zc-cart-remove-error', {
                      changeType: 'remove-line',
                      variantId: variantID,
                      source: 'cart-items',
                  });
              }
          } finally {
              this.removeLoading();
          }
      }

      setLoading() {
          this.overlay?.classList.remove('hidden');
      }

      removeLoading() {
          this.overlay?.classList.add('hidden');
      }
  }

  if (!customElements.get('cart-items')) {
    customElements.define('cart-items', CartItems);
  }
})();
