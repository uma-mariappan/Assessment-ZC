import { zcAdapter } from './network-adapter-730892702895239.js';

if (!customElements.get('product-wishlist')) {
  let productWishlistPortalSignedInCache = null;

  async function productWishlistIsPortalUserSignedIn() {
    if (!document.body || document.body.getAttribute('data-customer-portal') !== 'true') {
      return true;
    }
    if (productWishlistPortalSignedInCache === true || productWishlistPortalSignedInCache === false) {
      return productWishlistPortalSignedInCache;
    }
    try {
      const response = await zcAdapter.getPortalUser();
      if (!response.ok) {
        productWishlistPortalSignedInCache = false;
        return false;
      }
      const data = await response.json();
      const current_user = data?.current_user;
      const ok = !!(current_user && typeof current_user === 'object' && Object.keys(current_user).length > 0);
      productWishlistPortalSignedInCache = ok;
      return ok;
    } catch {
      productWishlistPortalSignedInCache = false;
      return false;
    }
  }

  function productWishlistSignInUrl() {
    const from_body = document.body && document.body.getAttribute('data-signin-url');
    if (from_body) {
      return from_body;
    }
    try {
      return new URL('/signin', window.location.origin).href;
    } catch {
      return '/signin';
    }
  }

  class ProductWishlist extends HTMLElement {
    constructor() {
      super();
      this.isProcessing = false;
    }

    connectedCallback() {
      const variant_elements = this.querySelectorAll('[data-variant-id]');
      const variant_ids = Array.from(variant_elements)
        .map(el => (el.getAttribute('data-variant-id') || '').trim())
        .filter(Boolean);

      const variant_ids_string = [...new Set(variant_ids)].join(',');

      variant_elements.forEach(el => {
        const wishlist_btn = el.querySelector('button');
        const variant_id = (el.getAttribute('data-variant-id') || '').trim();

        if (!wishlist_btn || !variant_id) {
          return;
        }

        wishlist_btn.addEventListener('click', evt => {
          evt.preventDefault();
          evt.stopPropagation();
          this.toggleWishlist(evt.currentTarget, variant_id);
        });
      });

      if (variant_ids_string.length === 0) {
        return;
      }

      productWishlistIsPortalUserSignedIn()
        .then(signed_in => {
          if (!signed_in) {
            return;
          }
          return zcAdapter.getWishlistEnabledForVariants(variant_ids_string)
            .then(res => {
              if (res.redirected || !res.ok) {
                return;
              }
              const content_type = res.headers.get('content-type') || '';
              if (!content_type.includes('application/json')) {
                return;
              }
              return res.json();
            })
            .then(data => {
              if (!data?.variants) {
                return;
              }

              const wishlist_map = data.variants;
              variant_elements.forEach(el => {
                const variant_id = (el.getAttribute('data-variant-id') || '').trim();
                const wishlist_btn = el.querySelector('button');
                if (!wishlist_btn || !variant_id) {
                  return;
                }

                const is_wishlisted = wishlist_map[variant_id] === true;
                wishlist_btn.classList.toggle('wishlist-added', is_wishlisted);
                wishlist_btn.classList.toggle('wishlist-removed', !is_wishlisted);
                wishlist_btn.setAttribute('aria-pressed', is_wishlisted ? 'true' : 'false');
              });
            });
        })
        .catch(() => {});
    }

    async toggleWishlist(clicked_btn, variant_id) {
      const id = (variant_id || '').trim();
      if (!id || this.isProcessing) {
        return;
      }

      const signed_in = await productWishlistIsPortalUserSignedIn();
      if (!signed_in) {
        window.location.href = productWishlistSignInUrl();
        return;
      }

      this.isProcessing = true;

      const already_added = clicked_btn.classList.contains('wishlist-added');

      if (already_added) {
        await this.removeFromWishlist(clicked_btn, id);
      } else {
        await this.addToWishlist(clicked_btn, id);
      }

      this.isProcessing = false;
    }

    async addToWishlist(clicked_btn, variant_id) {
      const form_data = new FormData();
      form_data.append('variant_ids', variant_id);

      try {
        const response = await zcAdapter.postWishlistVariants(form_data);

        if (this.isAuthRedirect(response)) {
          window.location.href = response.redirected ? response.url : productWishlistSignInUrl();
          return;
        }

        if (!response.ok) {
          if (typeof window.zcDispatchStorefrontEvent === 'function') {
            window.zcDispatchStorefrontEvent('zc-wishlist-product-add-error', {
              intent: 'add',
              variantId: variant_id,
            });
          }
          return;
        }

        const json = await response.json();
        this.displayMessage(json.code, json.message);

        this.syncButtonsForVariant(variant_id, true);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          if (json && json.code === 0) {
            window.zcDispatchStorefrontEvent('zc-wishlist-product-add-success', {
              variantId: variant_id,
              code: json.code,
            });
          } else {
            window.zcDispatchStorefrontEvent('zc-wishlist-product-add-error', {
              intent: 'add',
              variantId: variant_id,
              code: json != null ? json.code : null,
            });
          }
        }
      } catch (error) {
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent('zc-wishlist-product-add-error', {
            intent: 'add',
            variantId: variant_id,
          });
        }
      }
    }

    isAuthRedirect(response) {
      if (response.redirected) {
        return true;
      }
      const content_type = response.headers.get('content-type') || '';
      return !content_type.includes('application/json');
    }

    async removeFromWishlist(clicked_btn, variant_id) {
      try {
        const response = await zcAdapter.deleteWishlistVariantsByQuery(variant_id);

        if (this.isAuthRedirect(response)) {
          window.location.href = response.redirected ? response.url : productWishlistSignInUrl();
          return;
        }

        if (!response.ok) {
          if (typeof window.zcDispatchStorefrontEvent === 'function') {
            window.zcDispatchStorefrontEvent('zc-wishlist-product-remove-error', {
              intent: 'remove',
              variantId: variant_id,
            });
          }
          return;
        }

        const json = await response.json();
        this.displayMessage(json.code, json.message);

        this.syncButtonsForVariant(variant_id, false);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          if (json && json.code === 0) {
            window.zcDispatchStorefrontEvent('zc-wishlist-product-remove-success', {
              variantId: variant_id,
              code: json.code,
            });
          } else {
            window.zcDispatchStorefrontEvent('zc-wishlist-product-remove-error', {
              intent: 'remove',
              variantId: variant_id,
              code: json != null ? json.code : null,
            });
          }
        }
      } catch (error) {
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent('zc-wishlist-product-remove-error', {
            intent: 'remove',
            variantId: variant_id,
          });
        }
      }
    }

    syncButtonsForVariant(variant_id, is_added) {
      document.querySelectorAll(`[data-variant-id="${variant_id}"] button`).forEach(btn => {
        btn.classList.toggle('wishlist-added', is_added);
        btn.classList.toggle('wishlist-removed', !is_added);
        btn.setAttribute('aria-pressed', is_added ? 'true' : 'false');
      });
    }

    displayMessage(status_code, message) {
      const msg = document.querySelector('quantity-message');
      if (!msg) {
        return;
      }
      try {
        status_code === 0 ? msg.showSuccess(message) : msg.showError(message);
      } catch (err) {
      }
    }
  }

  customElements.define('product-wishlist', ProductWishlist);
}
