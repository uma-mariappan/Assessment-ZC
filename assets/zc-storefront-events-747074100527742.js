/**
 * ZCommerce storefront integration events (document-level CustomEvent, bubbles).
 * Only the allowlisted `zc-*` names below may be dispatched.
 * Listen: document.addEventListener('zc-cart-add-success', (e) => { ... e.detail })
 */
(function () {
  var ZC_STOREFRONT_EVENT_NAMES = [
    'zc-product-listing-load-success',
    'zc-product-listing-load-error',
    'zc-product-attribute-select',
    'zc-cart-add-error',
    'zc-cart-add-success',
    'zc-cart-remove-error',
    'zc-cart-remove-success',
    'zc-cart-update-error',
    'zc-cart-update-success',
    'zc-quote-add-error',
    'zc-quote-add-success',
    'zc-quote-remove-error',
    'zc-quote-remove-success',
    'zc-quote-update-error',
    'zc-quote-update-success',
    'zc-recommended-products-error',
    'zc-recommended-products-success',
    'zc-search-predictive-results-error',
    'zc-search-predictive-results-success',
    'zc-wishlist-product-add-success',
    'zc-wishlist-product-add-error',
    'zc-wishlist-product-remove-success',
    'zc-wishlist-product-remove-error',
    'zc-product-reviews-load-error',
    'zc-product-reviews-load-success',
    'zc-product-review-add-success',
    'zc-product-review-add-error',
    'zc-product-review-edit-success',
    'zc-product-review-edit-error',
    'zc-save-for-later-error',
    'zc-save-for-later-success'
  ];

  var allowed = {};
  for (var i = 0; i < ZC_STOREFRONT_EVENT_NAMES.length; i++) {
    allowed[ZC_STOREFRONT_EVENT_NAMES[i]] = true;
  }

  window.zcDispatchStorefrontEvent = function zcDispatchStorefrontEvent(eventName, detail) {
    if (!eventName || typeof eventName !== 'string' || eventName.indexOf('zc-') !== 0) {
      return;
    }
    if (!allowed[eventName]) {
      return;
    }
    try {
      document.dispatchEvent(
        new CustomEvent(eventName, {
          bubbles: true,
          detail: detail != null && typeof detail === 'object' ? detail : {}
        })
      );
    } catch (_e) {
      /* ignore */
    }
  };

  window.zcStorefrontEventNames = ZC_STOREFRONT_EVENT_NAMES.slice();
})();
