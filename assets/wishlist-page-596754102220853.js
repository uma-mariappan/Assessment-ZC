import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class WishlistPage extends HTMLElement {

    connectedCallback() {
      this.loader = document.querySelector("[page-loader]");
      this.productList = this.querySelector("#productList");
      this.searchInput = this.querySelector("[data-search-input]");
      this.attachEventListeners();
    }

    attachEventListeners = () => {
      const wishlistProducts = this.querySelectorAll("[data-variant-id]");
      wishlistProducts.forEach(product => {
        const variantId = product.getAttribute("data-variant-id");
        const deleteBtn = product.querySelector('.delete-btn');
        if (!variantId || !deleteBtn) return;
        deleteBtn.addEventListener("click", () => this.removeItemFromWishList(variantId));
      });

      if (this.searchInput) {
        this.searchInput.addEventListener("input", this.filterWishlistProducts);
      }
    }

    filterWishlistProducts = () => {
      const query = this.searchInput.value.toLowerCase().trim();
      const products = this.productList.querySelectorAll("[data-wishlist-product]");

      products.forEach(product => {
        const titleElement = product.querySelector("[data-wishlist-title]");
        const title = titleElement?.textContent.toLowerCase() || "";
        if (title.includes(query)) {
          product.classList.remove('hidden');
        } else {
          product.classList.add('hidden');
        }
      });
    }

    getWishlistPage = async () => {
      try {
        const res = await zcAdapter.getWishlistsMarkup();
        if (!res.ok) throw new Error('Error');
        return await res.text();
      } catch (err) {
        console.error(err);
      }
    }

    removeItemFromWishList = async (variantId) => {
      try {
        if (this.loader) this.loader.classList.remove("hidden");
        const response = await zcAdapter.deleteWishlistVariantsByQuery(variantId);

        const wishlistPage = await this.getWishlistPage();
        const parser = new DOMParser();
        const doc = parser.parseFromString(wishlistPage, "text/html");

        const newWishlistSection = doc.querySelector("#productList");
        if (newWishlistSection) {
          this.querySelector("#productList").innerHTML = newWishlistSection.innerHTML;
        }

        if (!response.ok) {
          if (typeof window.zcDispatchStorefrontEvent === 'function') {
            window.zcDispatchStorefrontEvent('zc-wishlist-product-remove-error', {
              intent: 'remove',
              variantId: variantId,
              source: 'wishlist-page',
            });
          }
          return console.error(await response.text());
        }
        const json = await response.json();
        this.displayMessage(json.code, json.message);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          if (json && json.code === 0) {
            window.zcDispatchStorefrontEvent('zc-wishlist-product-remove-success', {
              variantId: variantId,
              code: json.code,
              source: 'wishlist-page',
            });
          } else {
            window.zcDispatchStorefrontEvent('zc-wishlist-product-remove-error', {
              intent: 'remove',
              variantId: variantId,
              code: json != null ? json.code : null,
              source: 'wishlist-page',
            });
          }
        }
        this.attachEventListeners();

      } catch (error) {
        console.error("Network error:", error);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent('zc-wishlist-product-remove-error', {
            intent: 'remove',
            variantId: variantId,
            source: 'wishlist-page',
          });
        }
      } finally {
        if (this.loader) this.loader.classList.add('hidden');
      }
    }

    displayMessage(statusCode, message) {
      const msg = document.querySelector("quantity-message");
      if (!msg) return;
      statusCode === 0 ? msg.showSuccess(message) : msg.showError(message);
    }
  }

  if (!customElements.get('wishlist-page')) {
    customElements.define('wishlist-page', WishlistPage);
  }
})();
