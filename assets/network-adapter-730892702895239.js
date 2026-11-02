'use strict';

const STOREFRONT_ORIGIN_KEY = '_zcStorefrontDomain';

function getStorefrontBaseOrigin() {
  const w = globalThis;
  const fromEditor = w[STOREFRONT_ORIGIN_KEY];
  if (typeof fromEditor === 'string' && fromEditor.length > 0) {
    return new URL(fromEditor).origin;
  }
  return '';
}

function resolveUrl(resource) {
  if (resource == null || typeof resource !== 'string') {
    return resource;
  }
  const trimmed = resource.trim();
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const baseOrigin = getStorefrontBaseOrigin();
  if (trimmed.charAt(0) === '/') {
    return baseOrigin + trimmed;
  }
  return resource;
}

function buildStorefrontSecurityHeaders() {
  const row = document.cookie.split('; ').find((r) => r.startsWith('zoscscook='));
  const val = row ? row.split('=')[1] : null;
  return { 'x-zcsrf-token': 'zoscsparam=' + val };
}

function fetch(resource, init) {
  init = init ? Object.assign({}, init) : {};
  const method = String(init.method || 'GET').toUpperCase();
  init.method = method;
  if (method !== 'GET') {
    init.headers = Object.assign({}, buildStorefrontSecurityHeaders(), init.headers || {});
  }
  return globalThis.fetch(resolveUrl(resource), init);
}

export const zcAdapter = {
  fetch,

  getPortalUser() {
    return fetch('/portal/user');
  },
  getStorefrontCart() {
    return fetch('/storefront/api/v1/cart');
  },
  getStorefrontQuote() {
    return fetch('/storefront/api/v1/quote');
  },
  getCurrencies() {
    return fetch('/storefront/api/v1/currencies');
  },
  updateCurrency(currencyCode) {
    return fetch('/updatecurrency?currency_code=' + encodeURIComponent(currencyCode), {
      method: 'PUT'
    });
  },

  getWishlistsMarkup() {
    return fetch('/wishlists');
  },
  getWishlistEnabledForVariants(variantIdsString) {
    return fetch('/wishlists/wishlist-enabled?variant_ids=' + encodeURIComponent(variantIdsString));
  },
  postWishlistVariants(formData) {
    return fetch('/wishlists/variants', { method: 'POST', body: formData });
  },
  deleteWishlistVariantsByQuery(variantId) {
    return fetch('/wishlists/variants?variant_ids=' + encodeURIComponent(variantId), {
      method: 'DELETE'
    });
  }
};
