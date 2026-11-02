import { zcAdapter } from './network-adapter-730892702895239.js';

let requestQuotePortalSignedInCache = null;

async function requestQuoteIsPortalUserSignedIn() {
  if (!document.body || document.body.getAttribute('data-customer-portal') !== 'true') {
    return true;
  }
  if (requestQuotePortalSignedInCache === true || requestQuotePortalSignedInCache === false) {
    return requestQuotePortalSignedInCache;
  }
  try {
    const response = await zcAdapter.getPortalUser();
    if (!response.ok) {
      requestQuotePortalSignedInCache = false;
      return false;
    }
    const data = await response.json();
    const current_user = data?.current_user;
    const ok = !!(current_user && typeof current_user === 'object' && Object.keys(current_user).length > 0);
    requestQuotePortalSignedInCache = ok;
    return ok;
  } catch {
    requestQuotePortalSignedInCache = false;
    return false;
  }
}

function requestQuoteSignInUrl() {
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

(() => {
  class RequestQuote extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('#product-quote-form');
      if (!this.form) {
        return;
      }
      this.quantityMessage = document.querySelector('quantity-message');
      this.quotePopup = this.querySelector('[data-quote-popup]');
      this.quickViewPage = this.form.getAttribute('data-product-quick-view');
      this.requestquoteBtn = this.querySelector('[data-request-quote], [data-quick-view-quote]');
      if (this.quickViewPage) {
        this.quantityCounterComponent =
          this.closest('[data-quick-view], [data-quick-view-content]')?.querySelector('[data-quick-view-counter]') ||
          document.querySelector('[data-quick-view-counter]');
      } else {
        this.quantityCounterComponent = document.querySelector('[data-product-detail-counter]');
      }

      this.form.addEventListener('submit', this.requestQuotehandler);
    }

    disconnectedCallback() {
      this.form?.removeEventListener('submit', this.requestQuotehandler);
    }

    getQuantityInput() {
      const scope =
        this.form?.closest('[data-quick-view-content], [data-quick-view], [data-product-detail-page]') ||
        document;

      return (
        scope.querySelector('[data-quick-view-counter] input[name="quantity"]') ||
        scope.querySelector('[data-product-detail-counter] input[name="quantity"]') ||
        scope.querySelector('input[name="quantity"]')
      );
    }

    requestQuotehandler = async (event) => {
      event.preventDefault();

      const signed_in = await requestQuoteIsPortalUserSignedIn();
      if (!signed_in) {
        window.location.href = requestQuoteSignInUrl();
        return;
      }

      const btnTextEl = this.requestquoteBtn?.querySelector('.quote-btn-text');
      const spinnerEl = this.form?.querySelector('.quote-spinner');
      const quantityInput = this.getQuantityInput();

      btnTextEl?.classList.add('hidden');
      spinnerEl?.classList.remove('hidden');

      const formData = new FormData(this.form);
      formData.append('sections', 'quote-popup');

      if (quantityInput) {
        formData.append('quantity', quantityInput.value);
      }

      try {
        const response = await zcAdapter.fetch('/addtoquote', {
          method: 'POST',
          body: formData
        });
        const contentType = response.headers.get('content-type') || '';
        if (response.redirected || !contentType.includes('application/json')) {
          window.location.href = response.redirected ? response.url : requestQuoteSignInUrl();
          return;
        }

        const json = await response.json();
        const variantId = formData.get('variant_id');

        const redirect_url = json.redirect_url;
        if (redirect_url && typeof redirect_url === 'string' && redirect_url.trim() !== '') {
          window.location.href = redirect_url;
          return;
        }

        if (!this.form.getAttribute('data-product-quick-view')){
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }else{
          const modalContent = this.closest('[data-quick-view], [data-quick-view-content], quick-view');
          if (modalContent) {
            modalContent.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }
        }

        if (!response.ok || json.code !== 0) {
          this.quantityMessage?.classList.add('z-index-0');
          this.quantityMessage?.showError(json.message || 'Error');
          if (typeof window.zcDispatchStorefrontEvent === 'function') {
            window.zcDispatchStorefrontEvent('zc-quote-add-error', {
              variantId: variantId != null ? String(variantId) : null,
              code: json != null ? json.code : null,
              message: json != null ? json.message : null,
              source: 'request-quote',
            });
          }
          return;
        }

        const messageEl = this.quantityMessage || document.querySelector('quantity-message');
        messageEl?.showSuccess(json.message || 'Added to quote.');

        const quotePopupSection = json.sections['quote-popup'];
        this.quotePopup.innerHTML = new DOMParser().parseFromString(quotePopupSection, 'text/html').body.innerHTML;

        const quoteMessage = this.quotePopup.querySelector('#quoteMessage');
        if(quoteMessage) {
          quoteMessage.innerHTML = json.message;
        }

        if(quantityInput) quantityInput.value = 1;

        document.querySelector('app-header')?.getQuoteCount();

        this.quotePopup.setAttribute('open', '');
        this.quotePopup.classList.remove('slide-down');
        setTimeout(() => {
          this.quotePopup.classList.remove('hidden');
        }, 200);
        this.quotePopup.classList.add('slide-up');

        setTimeout(() => {
          this.quotePopup.classList.remove('slide-up');
          this.quotePopup.classList.add('slide-down');
          setTimeout(() => {
            this.quotePopup.classList.add('hidden');
            this.quotePopup.removeAttribute('open');
          }, 200);
        }, 3000);

        const closePopup = this.quotePopup.querySelector('#popupClose');
        closePopup?.addEventListener('click', () => {
          this.quotePopup.removeAttribute('open');
          this.quotePopup.classList.remove('slide-up');
          setTimeout(() => {
            this.quotePopup.classList.add('slide-down');
            this.quotePopup.classList.add('hidden');
          }, 200);
        });

        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent('zc-quote-add-success', {
            variantId: variantId != null ? String(variantId) : null,
            code: json.code,
            source: 'request-quote',
            popup: true,
          });
        }

      } catch (error) {
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          let qv;
          try {
            qv = this.form ? new FormData(this.form).get('variant_id') : null;
          } catch (_e) {
            qv = null;
          }
          window.zcDispatchStorefrontEvent('zc-quote-add-error', {
            variantId: qv != null ? String(qv) : null,
            source: 'request-quote',
            error: String(error && error.message ? error.message : error),
          });
        }
        this.quantityMessage?.showError('Failed to add to quote. Please try again.');
      } finally {
        btnTextEl?.classList.remove('hidden');
        spinnerEl?.classList.add('hidden');
      }
    };
  }

  if (!customElements.get('request-quote')) {
    customElements.define('request-quote', RequestQuote);
  }
})();
