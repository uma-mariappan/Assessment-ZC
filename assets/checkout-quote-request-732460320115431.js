import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class CheckoutQuoteRequest extends HTMLElement {
      connectedCallback() {
          this.button = this.querySelector('#requestQuoteBtn button');
          this.textarea = this.querySelector('textarea');
          this.overlay = document.querySelector('[page-loader]');

          this.editShippingBilling = this.querySelector('#editShippingBilling');
          this.editShipping = this.querySelector('#editShipping');
          this.editBilling = this.querySelector('#editBilling');

          this.selectedShippingAddressId = this.editShipping?.getAttribute('data-selected-address-id');
          this.selectedBillingAddressId = this.editBilling?.getAttribute('data-selected-billing-address-id');

          this.checkoutAddressTemplate = document.querySelector('#checkoutAddressTemplate');
          this.checkoutShippingTemplate = document.querySelector('#checkoutShippingTemplate');
          this.requestQuoteTemplate = document.querySelector('#requestQuoteTemplate');
          this.checkoutPaymentTemplate = document.querySelector('#checkoutPaymentTemplate');

          this.addressPage = document.querySelector('#addressPage');
          this.requestQuotePage = document.querySelector('#dispatchPage');

          this.quoteId = this.querySelector('#requestQuoteBtn')
              .getAttribute('data-quote-id');

          this.button?.addEventListener('click', (e) => this.requestQuote(e));
          this.bindAddressEditActions();
      }

      bindAddressEditActions() {
          if (this.editShippingBilling) {
              this.editShippingBilling.addEventListener('click', async () => {
                  const loaded = await this.loadAddressSection();
                  if (!loaded) return;
                  this.activateAddressStep();
              });
              return;
          }

          this.editShipping?.addEventListener('click', async () => {
              const loaded = await this.loadAddressSection();
              if (!loaded) return;

              if (this.selectedShippingAddressId) {
                  const shippingInput = document.querySelector(
                      `[data-shipping-address-id="${this.selectedShippingAddressId}"]`
                  );
                  if (shippingInput) shippingInput.checked = true;
              }

              if (this.selectedBillingAddressId) {
                  const billingInput = document.querySelector(
                      `[data-billing-address-id="${this.selectedBillingAddressId}"]`
                  );
                  if (billingInput) billingInput.checked = true;
              }

              this.activateAddressStep();
          });

          this.editBilling?.addEventListener('click', async () => {
              const loaded = await this.loadAddressSection();
              if (!loaded) return;

              const addressListBillingCheckbox = document.querySelector('#addressListBillingCheckbox');
              if (addressListBillingCheckbox) {
                  addressListBillingCheckbox.checked = false;
              }

              const billingList = document.querySelector('#listOfBillingAddress');
              if (billingList) {
                  billingList.classList.remove('hidden');
                  billingList.scrollIntoView({ block: 'start' });
                  setTimeout(() => {
                      window.scrollBy({
                          top: -window.innerHeight / 2,
                          behavior: 'smooth'
                      });
                  }, 50);
              }

              if (this.selectedShippingAddressId) {
                  const shippingInput = document.querySelector(
                      `[data-shipping-address-id="${this.selectedShippingAddressId}"]`
                  );
                  if (shippingInput) shippingInput.checked = true;
              }

              if (this.selectedBillingAddressId) {
                  const billingInput = document.querySelector(
                      `[data-billing-address-id="${this.selectedBillingAddressId}"]`
                  );
                  if (billingInput) billingInput.checked = true;
              }

              this.activateAddressStep();
          });
      }

      async loadAddressSection() {
          try {
              this.setLoading();

              const response = await zcAdapter.fetch(window.location.pathname + window.location.search, { method: 'GET' });

              if (!response.ok) {
                  console.error("Failed to reload checkout");
                  return false;
              }

              const htmlContent = await response.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlContent, 'text/html');

              const checkoutJson = doc.querySelector('#checkoutDetailsJson');
              if (checkoutJson) {
                  window.checkout_data = JSON.parse(checkoutJson.textContent);
              }

              const respAddress = doc.querySelector('#checkoutAddressTemplate');
              if (!respAddress) {
                  console.error("Address template missing in response");
                  return false;
              }

              this.checkoutAddressTemplate.innerHTML = respAddress.innerHTML;
              this.checkoutAddressTemplate.classList.remove('hidden');
              this.checkoutShippingTemplate?.classList.add('hidden');
              this.requestQuoteTemplate?.classList.add('hidden');
              this.checkoutPaymentTemplate?.classList.add('hidden');

              window.scrollTo({ top: 0, behavior: 'smooth' });
              return true;
          } catch (error) {
              console.error(error);
              return false;
          } finally {
              this.removeLoading();
          }
      }

      activateAddressStep() {
          if (!this.addressPage || !this.requestQuotePage) return;
          this.addressPage.classList.add('border-b', 'border-color');
          this.addressPage.classList.remove('opacity-45');

          this.requestQuotePage.classList.remove('border-b', 'border-color');
          this.requestQuotePage.classList.add('opacity-45');
      }

      async requestQuote(e) {
          e.preventDefault();

          const comments = this.textarea?.value?.trim() || "";

          try {
              const response = await zcAdapter.fetch(`/checkout/quote/${this.quoteId}`, {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                      comments: comments
                  })
              });

              if (!response.ok) {
                  throw new Error('Request failed');
              }

              const responseData = await response.json();

              // redirect on success
              window.location.href = responseData.redirect_url;

          } catch (error) {
              console.error("Quote request error:", error);
          }
      }

      setLoading() {
          this.overlay?.classList.remove('hidden');
      }
      
      removeLoading() {
          this.overlay?.classList.add('hidden');
      }
  }

  if (!customElements.get('checkout-quote-request')) {
    customElements.define('checkout-quote-request', CheckoutQuoteRequest);
  }
})();
