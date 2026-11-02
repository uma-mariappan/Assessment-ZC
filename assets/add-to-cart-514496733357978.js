import { zcAdapter } from './network-adapter-730892702895239.js';

const QUICK_VIEW_CLOSE_MS = 220;
const CART_POPUP_CLASSES =
  'hidden fixed right-4 top-28 md:top-32 w-[90%] max-w-[320px] bg-white shadow-2xl rounded-md z-[100] border';

let activeCartPopupTimer = null;

function ensureGlobalCartPopup() {
  let popup = document.querySelector('[data-global-cart-popup]');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'globalCartPopup';
    popup.setAttribute('data-cart-popup', '');
    popup.setAttribute('data-global-cart-popup', '');
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-hidden', 'true');
    popup.className = CART_POPUP_CLASSES;
    popup.style.borderColor = 'var(--color-border, #E5E5E5)';
    document.body.appendChild(popup);
  } else if (popup.parentElement !== document.body) {
    document.body.appendChild(popup);
  }
  return popup;
}

function closeOpenQuickView(callback) {
  const open_modal = document.querySelector('[data-quick-view-modal].is-open');
  const quick_view = open_modal?.closest('quick-view');
  if (quick_view && typeof quick_view.handleClose === 'function') {
    quick_view.handleClose();
    if (typeof callback === 'function') {
      window.setTimeout(callback, QUICK_VIEW_CLOSE_MS);
    }
    return true;
  }
  if (typeof window.__pinkBeautyQuickViewClose === 'function') {
    window.__pinkBeautyQuickViewClose();
    if (typeof callback === 'function') {
      window.setTimeout(callback, QUICK_VIEW_CLOSE_MS);
    }
    return true;
  }
  if (typeof callback === 'function') {
    callback();
  }
  return false;
}

(() => {
  class AddToCart extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('#product-form');
      if (!this.form) {
        return;
      }

      this.quantityMessage = document.querySelector('quantity-message');
      this.cartPopup = this.querySelector('[data-cart-popup]');
      this.addToCartBtn = this.querySelector('[data-add-to-cart]');
      this.outOfStockBtn = this.querySelector('[data-out-of-stock]');
      this.quantityBlock =
        this.closest('[data-quantity]') ||
        this.querySelector('[data-quantity-block]') ||
        document.querySelector('[data-quantity-block]') ||
        document.querySelector('[data-product-detail-counter]');
      this.quotesEnabled = !!document.querySelector('request-quote');

      if (this.form.hasAttribute('data-product')) {
        try {
          this.productData = JSON.parse(this.form.getAttribute('data-product'));
          this.handleProductAvailability();
        } catch (e) {
          console.error('Invalid JSON in data-product attribute', e);
        }
      }

      this.quickViewContainer = this.closest('quick-view, [data-quick-view-modal], [data-quick-view-content]');

      this.addEventListener('input', (e) => {
        const field = e.target;
        if (!field.hasAttribute('data-validate') || field.closest('custom-fields')) return;
        const errorEl = this.querySelector('[data-field-error="' + field.id + '"]');
        if (errorEl && field.value && field.value.trim() !== '') errorEl.classList.add('hidden');
      });

      this.addEventListener('change', (e) => {
        const field = e.target;
        if (!field.hasAttribute('data-validate') || field.closest('custom-fields')) return;
        const errorEl = this.querySelector('[data-field-error="' + field.id + '"]');
        if (!errorEl) return;
        if (field.type === 'checkbox') {
          if (field.checked) errorEl.classList.add('hidden');
        } else if (field.type === 'file') {
          if (field.getAttribute('data-uploaded-attachment-id')) errorEl.classList.add('hidden');
        } else if (field.value && field.value.trim() !== '') {
          errorEl.classList.add('hidden');
        }
      });

      this.form.addEventListener('submit', this.addToCarthandler);
    }

    disconnectedCallback() {
      this.form?.removeEventListener('submit', this.addToCarthandler);
    }

    isInQuickView() {
      return !!(
        this.closest('quick-view') ||
        this.closest('[data-quick-view-modal]') ||
        this.closest('[data-quick-view-content]') ||
        this.form?.getAttribute('data-product-quick-view') === 'true'
      );
    }

    resolveCartPopupTarget() {
      if (this.isInQuickView()) {
        return ensureGlobalCartPopup();
      }
      return this.cartPopup || ensureGlobalCartPopup() || document.querySelector('[data-cart-popup]');
    }

    validateMandatoryFields() {
      const mainContainer = (this.quickViewContainer || document).querySelector('[data-custom-field-main-container]');
      if (!mainContainer) return true;
      const container = mainContainer.querySelector('[data-variant-custom-fields]:not(.hidden)') || mainContainer;

      let isValid = true;
      container.querySelectorAll('[data-validate="required"]').forEach(field => {
        const errorEl = container.querySelector('[data-field-error="' + field.id + '"]');
        let isEmpty = false;

        if (field.type === 'checkbox') {
          isEmpty = !field.checked;
        } else if (field.type === 'file') {
          isEmpty = !field.getAttribute('data-uploaded-attachment-id');
        } else {
          isEmpty = !field.value || field.value.trim() === '';
        }

        if (errorEl) errorEl.classList.toggle('hidden', !isEmpty);
        if (isEmpty) isValid = false;
      });

      if (!isValid) {
        this.openCustomFieldsTab(mainContainer);
      }

      return isValid;
    }

    openCustomFieldsTab(mainContainer) {
      const firstError = mainContainer.querySelector('[data-field-error]:not(.hidden)');
      const tabsComponent = document.querySelector('product-details-tabs');
      if (tabsComponent && typeof tabsComponent.setActiveTab === 'function') {
        tabsComponent.setActiveTab('custom-fields');
      }

      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    collectCustomFields() {
      const mainContainer = (this.quickViewContainer || document).querySelector('[data-custom-field-main-container]');
      if (!mainContainer) return [];
      const container = mainContainer.querySelector('[data-variant-custom-fields]:not(.hidden)') || mainContainer;

      const customFields = [];
      container.querySelectorAll('[data-custom-field-id]').forEach(input => {
        const customfield_id = input.getAttribute('data-custom-field-id');
        const data_type = input.getAttribute('data-field-type');
        const label = input.getAttribute('data-label');

        let value;
        if (input.type === 'checkbox') {
          value = input.checked ? 'true' : 'false';
        } else if (input.type === 'file') {
          value = input.getAttribute('data-uploaded-attachment-id') || '';
        } else {
          value = input.value;
        }

        customFields.push({ customfield_id, label, data_type, value });
      });

      return customFields;
    }

    getCartId() {
      const match = (name) =>
        document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=').slice(1).join('=') || '';
      return match('zcid');
    }

    async uploadAttachments() {
      const mainContainer = (this.quickViewContainer || document).querySelector('[data-custom-field-main-container]');
      if (!mainContainer) { return; }
      const container = mainContainer.querySelector('[data-variant-custom-fields]:not(.hidden)') || mainContainer;

      const fileInputs = [...container.querySelectorAll('[data-field-type="attachment"]')]
        .filter(input => input.files?.[0] && !input.getAttribute('data-uploaded-attachment-id'));

      if (!fileInputs.length) { return; }

      const variantId = this.form.querySelector('[name="variant_id"]')?.value || '';

      for (const input of fileInputs) {
        const customfieldId = input.getAttribute('data-custom-field-id');
        const cartId = this.getCartId();

        const body = new FormData();
        body.append('variant_id', variantId);
        body.append('document', input.files[0]);

        let url = `/storefront/api/v1/cart/customfields/documents/upload/${customfieldId}`;
        if (cartId) {
          body.append('cart_id', cartId);
          url += `?cart_id=${encodeURIComponent(cartId)}`;
        } else {
          body.append('new_cart', true);
        }

        const res = await fetch(url, { method: 'POST', body });
        if (!res.ok) { throw new Error(`Attachment upload failed (field ${customfieldId}): ${res.statusText}`); }

        const json = await res.json();
        const uploadedId = json.documents?.document_id ?? json.document_id ?? json.id ?? json.data?.id ?? '';
        if (uploadedId) { input.setAttribute('data-uploaded-attachment-id', uploadedId); }
      }
    }

    getQuantityInput() {
      const quantity_scope =
        this.form?.closest('[data-quantity]') ||
        this.form?.closest('[data-quick-view-content]') ||
        this.closest('[data-quick-view-content], [data-quick-view-modal], quick-view');

      if (quantity_scope) {
        return quantity_scope.querySelector('input[name="quantity"]');
      }

      return document.querySelector('[data-product-detail-counter] input[name="quantity"]');
    }

    handleProductAvailability() {
      const isAvailable = Boolean(
        this.productData?.initial_variant?.available || this.productData?.available
      );

      if (isAvailable) {
        this.quantityBlock?.classList.remove('hidden');
        this.addToCartBtn?.classList.remove('hidden');
        this.outOfStockBtn?.classList.add('hidden');
      } else {
        if (this.quotesEnabled) {
          this.quantityBlock?.classList.remove('hidden');
        } else {
          this.quantityBlock?.classList.add('hidden');
        }
        this.addToCartBtn?.classList.add('hidden');
        this.outOfStockBtn?.classList.remove('hidden');
      }
    }

    showCartPopupAfterAdd(json, in_quick_view) {
      const cart_popup_target = this.resolveCartPopupTarget();
      const show_popup = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (cart_popup_target && json.sections && json.sections['cart-popup']) {
          this.fillAndShowCartPopup(cart_popup_target, json);
        }
      };

      if (in_quick_view) {
        closeOpenQuickView(show_popup);
      } else {
        show_popup();
      }
    }

    addToCarthandler = async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const btnTextEl = this.addToCartBtn?.querySelector('.btn-text');
      const spinnerEl = this.form?.querySelector('.spinner');
      const in_quick_view = this.isInQuickView();

      try {
        await this.uploadAttachments();
      } catch (uploadError) {
        console.error(uploadError);
        this.quantityMessage?.showError('File upload failed. Please try again.');
        return;
      }

      if (!this.validateMandatoryFields()) {
        return;
      }

      btnTextEl?.classList.add('hidden');
      spinnerEl?.classList.remove('hidden');

      const formData = new FormData(this.form);
      formData.append('sections', 'cart-popup');
      const isWishlistPage = this.form.getAttribute('data-wish-list') === 'true';

      const customFields = this.collectCustomFields();
      if (customFields.length > 0) {
        formData.append('custom_fields', JSON.stringify(customFields));
      }

      const quantityInput = this.getQuantityInput();

      if (isWishlistPage) {
        formData.append('quantity', 1);
      } else {
        formData.append('quantity', quantityInput?.value || 1);
      }

      try {
        const response = await zcAdapter.fetch('/addtocart', {
          method: 'POST',
          body: formData
        });

        const json = await response.json();
        const formDataForMeta = new FormData(this.form);
        const variantId = formDataForMeta.get('variant_id');
        const productId = this.productData?.id ?? formDataForMeta.get('product_id');
        const qtyVal = formDataForMeta.get('quantity');
        const ok = !!(response.ok && json && json.code === 0);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent(ok ? 'zc-cart-add-success' : 'zc-cart-add-error', {
            source: 'add-to-cart',
            variantId: variantId != null ? String(variantId) : null,
            productId: productId != null ? String(productId) : null,
            quantity: qtyVal != null && qtyVal !== '' ? Number(qtyVal) : 1,
            code: json != null ? json.code : null,
            message: json != null ? json.message : null,
            quickView: in_quick_view,
          });
        }

        if (!response.ok || json.code !== 0) {
          this.quantityMessage?.classList.add('z-index-0');
          this.quantityMessage?.showError(json.message || 'Error');
          return;
        }

        if (quantityInput) quantityInput.value = 1;

        document.querySelector('app-header')?.getCartCall();

        this.showCartPopupAfterAdd(json, in_quick_view);
      } catch (error) {
        console.error('Add to cart failed:', error);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          let fd;
          try {
            fd = this.form ? new FormData(this.form) : null;
          } catch (_e) {
            fd = null;
          }
          window.zcDispatchStorefrontEvent('zc-cart-add-error', {
            source: 'add-to-cart',
            variantId: fd && fd.get('variant_id') != null ? String(fd.get('variant_id')) : null,
            productId: this.productData?.id != null ? String(this.productData.id) : fd && fd.get('product_id') != null ? String(fd.get('product_id')) : null,
            error: String(error && error.message ? error.message : error),
          });
        }
        this.quantityMessage?.showError('Unable to add product to cart');
      } finally {
        btnTextEl?.classList.remove('hidden');
        spinnerEl?.classList.add('hidden');
      }
    };

    fillAndShowCartPopup(popup_el, json) {
      if (!popup_el) {
        return;
      }

      if (popup_el.parentElement !== document.body) {
        document.body.appendChild(popup_el);
      }

      const cart_products = json.sections['cart-popup'];
      popup_el.innerHTML = new DOMParser().parseFromString(cart_products, 'text/html').body.innerHTML;

      const cart_message = popup_el.querySelector('#cartMessage');
      if (cart_message) {
        cart_message.innerHTML = json.message || '';
      }

      this.showCartPopupOn(popup_el);

      const close_popup = popup_el.querySelector('#popupClose');
      close_popup?.addEventListener('click', () => this.hideCartPopupOn(popup_el), { once: true });
    }

    showCartPopupOn(popup_el) {
      if (!popup_el) {
        return;
      }

      if (activeCartPopupTimer) {
        clearTimeout(activeCartPopupTimer);
        activeCartPopupTimer = null;
      }

      popup_el.setAttribute('open', '');
      popup_el.setAttribute('aria-hidden', 'false');
      popup_el.classList.remove('slide-down', 'hidden');

      void popup_el.offsetHeight;
      popup_el.classList.add('slide-up');

      activeCartPopupTimer = setTimeout(() => this.hideCartPopupOn(popup_el), 3000);
    }

    hideCartPopupOn(popup_el) {
      if (!popup_el) {
        return;
      }

      if (activeCartPopupTimer) {
        clearTimeout(activeCartPopupTimer);
        activeCartPopupTimer = null;
      }

      popup_el.classList.remove('slide-up');
      popup_el.classList.add('slide-down');

      setTimeout(() => {
        popup_el.classList.add('hidden');
        popup_el.removeAttribute('open');
        popup_el.setAttribute('aria-hidden', 'true');
      }, 400);
    }

    showCartPopup = () => {
      this.showCartPopupOn(this.cartPopup);
    };

    hideCartPopup = () => {
      this.hideCartPopupOn(this.cartPopup);
    };
  }

  if (!customElements.get('add-to-cart')) {
    customElements.define('add-to-cart', AddToCart);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureGlobalCartPopup, { once: true });
  } else {
    ensureGlobalCartPopup();
  }
})();
