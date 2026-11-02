import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class SaveForLater extends HTMLElement {

      constructor() {
          super();
          this.overlay = document.querySelector('[page-loader]');
          this.cartPageSelector = '[data-cart-page]';
          this.handleClick = this.handleClick.bind(this);
      }

      connectedCallback() {
          document.addEventListener("click", this.handleClick);
      }

      disconnectedCallback() {
          document.removeEventListener("click", this.handleClick);
      }

      handleClick(event) {
          const saveBtn = event.target.closest(".btn-save-later");
          if (saveBtn) {
              event.preventDefault();
              this.saveItem(saveBtn.dataset.lineItemId);
              return;
          }

          const removeBtn = event.target.closest(".btn-remove");
          if (removeBtn) {
              event.preventDefault();
              this.removeItem(removeBtn.dataset.lineItemId);
              return;
          }

          const moveBtn = event.target.closest(".btn-move-cart");
          if (moveBtn) {
              event.preventDefault();
              this.moveToCart(moveBtn.dataset.variantId, moveBtn.dataset.lineItemId);
              return;
          }
      }

      updateCartPage(json) {
          const parser = new DOMParser();
          const cartPage = parser.parseFromString(
              json.sectionJson['cart-page'],
              "text/html"
          );
          const cartPageContent = cartPage.querySelector('[data-cart-page]');
          const currentCartPage = document.querySelector('[data-cart-page]');

          if (cartPageContent && currentCartPage) {
              currentCartPage.innerHTML = cartPageContent.innerHTML;
          }

          document.querySelector('app-header')?.getCartCall();
      }

      async saveItem(lineItemId) {
          this.setLoading();

          try {
              const response = await zcAdapter.fetch(`/cart/saveforlater?line_item_id=${lineItemId}&sections=cart-page`,{ 
                  method: "POST" 
              });

              const json = await response.json();

              if (!response.ok || json.code !== 0) {
                  this.displayMessage(json.code, json.message);
                  if (typeof window.zcDispatchStorefrontEvent === 'function') {
                      window.zcDispatchStorefrontEvent('zc-save-for-later-error', {
                          lineItemId: lineItemId,
                          code: json != null ? json.code : null,
                          source: 'save-for-later',
                      });
                  }
                  return;
              }

              this.updateCartPage(json);
              this.displayMessage(json.code, json.message);
              if (typeof window.zcDispatchStorefrontEvent === 'function') {
                  window.zcDispatchStorefrontEvent('zc-save-for-later-success', {
                      lineItemId: lineItemId,
                      code: json.code,
                      source: 'save-for-later',
                  });
              }

          } catch (err) {
              console.error("Error saving item:", err);
              if (typeof window.zcDispatchStorefrontEvent === 'function') {
                  window.zcDispatchStorefrontEvent('zc-save-for-later-error', {
                      lineItemId: lineItemId,
                      source: 'save-for-later',
                  });
              }
          } finally {
              this.removeLoading();
          }
      }

      async removeItem(lineItemId) {
          this.setLoading();
          this.isLoading = true;

          try {
              const response = await zcAdapter.fetch(`/cart/saveforlater?line_item_id=${lineItemId}&sections=cart-page`, { 
                  method: "DELETE"
              });

              const json = await response.json();

              if (!response.ok || json.code !== 0) {
                  this.displayMessage(json.code, json.message);
                  return;
              }

              this.updateCartPage(json);
              this.displayMessage(json.code, json.message);

          } catch (err) {
              console.error("Error removing item:", err);
          } finally {
              this.removeLoading();
          }
      }

      async moveToCart(productVariantId, lineItemId) {
          this.setLoading();
          this.isLoading = true;

          try {
              const response = await zcAdapter.fetch(`/movetocart?line_item_id=${lineItemId}&variant_id=${productVariantId}&sections=cart-page`,{ 
                  method: "POST"
              });

              const json = await response.json();

              if (!response.ok || json.code !== 0) {
                  this.displayMessage(json.code, json.message);
                  return;
              }

              this.updateCartPage(json);
              this.displayMessage(json.code, json.message)

          } catch (err) {
              console.error("Error moving item to cart:", err);
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

      setLoading() {
          this.overlay.classList.remove('hidden');
      }

      removeLoading() {
          this.overlay.classList.add('hidden');
      }
  }

  if (!customElements.get("save-for-later")) {
    customElements.define("save-for-later", SaveForLater);
  }
})();
