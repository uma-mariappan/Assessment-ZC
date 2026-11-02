import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class CheckoutDispatch extends HTMLElement {
      constructor() {
          super();

          this.addressListBillingCheckbox = document.querySelector('#addressListBillingCheckbox');
          this.editShippingBilling = this.querySelector('#editShippingBilling');
          this.editShipping = this.querySelector('#editShipping');
          this.addressId = this.querySelector('[data-selected-address-id]');
          this.editBilling = this.querySelector('#editBilling');
          this.selectedBillingaddressId = this.querySelector('[data-selected-billing-address-id]');
          this.isEmptyShippingMethods = this.querySelector('#isEmptyShippingMethods');
          this.shippingMethodSubmit = this.querySelector('#shippingMethodSubmit');
          this.shippingRadio = this.querySelectorAll('.shipping-radio span');

          this.checkoutAddressTemplate = document.querySelector('#checkoutAddressTemplate');
          this.checkoutShippingTemplate = document.querySelector('#checkoutShippingTemplate');
          this.checkoutPaymentTemplate = document.querySelector('#checkoutPaymentTemplate');
          this.checkoutCoupon = document.querySelector('checkout-coupon');

          this.addressPage = document.querySelector('#addressPage');
          this.dispatchPage = document.querySelector('#dispatchPage');
          this.reviewOrderPage = document.querySelector('#reviewOrderPage');
      }

      connectedCallback() {
          this.overlay = this.querySelector('[page-loader]');
          this.shippingform = this.querySelector('#shippingMethodsForm');
          this.shippingform.addEventListener('submit', this.handleShippingForm);
          
          this.shippingRadio.forEach(radios => {
              radios.addEventListener('click', () => {
                  this.shippingRadio.forEach(otherRadio => {
                      if (otherRadio !== radios) {
                          otherRadio.classList.remove('before:scale-100');
                          otherRadio.classList.add('before:scale-0');
                          this.querySelector(`#shipping_${otherRadio.getAttribute('value')}`).removeAttribute('checked');
                      } else {
                          this.querySelector(`#shipping_${otherRadio.getAttribute('value')}`).setAttribute('checked', 'checked');
                          if (!isEmptyShippingMethods.classList.contains('hidden')) {
                              isEmptyShippingMethods.classList.add('hidden');         
                          }
                      }
                  });
                  radios.classList.add('before:scale-100');
              });
          })

          this.loadAddressSection = async () => {
              try {
                  this.setLoading();

                  const response = await zcAdapter.fetch('checkout', { method: 'GET' });

                  if (!response.ok) {
                      console.error("Failed to reload checkout");
                      return false;
                  }

                  const htmlContent = await response.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(htmlContent, 'text/html');

                  window.checkout_data = JSON.parse(
                      doc.querySelector('#checkoutDetailsJson').textContent
                  );

                  const respAddress = doc.querySelector('#checkoutAddressTemplate');
                  const respCoupon = doc.querySelector('checkout-coupon');

                  if (!respAddress) {
                      console.error("Address template missing in response");
                      return false;
                  }

                  this.checkoutAddressTemplate.innerHTML = respAddress.innerHTML;
                  this.checkoutCoupon.innerHTML = respCoupon?.innerHTML ?? "";

                  this.checkoutAddressTemplate.classList.remove('hidden');
                  this.checkoutShippingTemplate.classList.add('hidden');
                  this.checkoutPaymentTemplate.classList.add('hidden');

                  window.scrollTo({ top: 0, behavior: 'smooth' });

                  return true;

              } catch (err) {
                  console.error(err);
                  return false;
              } finally {
                  this.removeLoading();
              }
          }


          if (this.editShippingBilling) {
              this.editShippingBilling.addEventListener('click', async () => {
                  const loaded = await this.loadAddressSection();
                  if (!loaded) return;
                  this.previousPage();
              });
          } else {
              this.editShipping.addEventListener('click', async () => {
                  const loaded = await this.loadAddressSection();
                  if (!loaded) return;

                  const shippingInput = document.querySelector(`[data-shipping-address-id="${this.addressId}"]`);
                  if (shippingInput) {
                     shippingInput.checked = true; 
                  }
                  const billingInput = document.querySelector(`[data-billing-address-id="${this.selectedBillingaddressId}"]`);
                  if (billingInput) {
                      billingInput.checked = true;
                  }
                  this.previousPage();
              });
      
              this.editBilling.addEventListener('click', async () => {
                  const loaded = await this.loadAddressSection();
                  if (!loaded) return;

                  document.querySelector('#addressListBillingCheckbox').checked = false;
                  const billingList = document.querySelector('#listOfBillingAddress');
                  billingList.classList.remove('hidden');
                  billingList.scrollIntoView({ block: 'start' });
                  setTimeout(() => {
                      window.scrollBy({
                          top: -window.innerHeight / 2,
                          behavior: 'smooth'
                      });
                  }, 50);
                  const shippingInput = document.querySelector(`[data-shipping-address-id="${this.addressId}"]`);
                  if (shippingInput) {
                     shippingInput.checked = true; 
                  }
                  const billingInput = document.querySelector(`[data-billing-address-id="${this.selectedBillingaddressId}"]`);
                  if (billingInput) {
                      billingInput.checked = true;
                  }
                  this.previousPage();
              });
          }
      }

      previousPage() {
          this.addressPage.classList.add('border-b', 'border-color');
          this.addressPage.classList.remove('opacity-45');

          this.dispatchPage.classList.remove('border-b', 'border-color');
          this.dispatchPage.classList.add('opacity-45');
      }

      handleShippingForm = async (event) => {
          event.stopPropagation();
          event.preventDefault();

          const formData = new FormData(this.shippingform);
          const formDataObject = Object.fromEntries(formData.entries());
          
          if (Object.keys(formDataObject).length === 0) {
              isEmptyShippingMethods.classList.remove('hidden');
              return;
          }
          this.setLoading();
          const response = await zcAdapter.fetch('checkout/shippingmethods', {
              method: 'PUT',
              body: JSON.stringify(formDataObject)
          });
      
          if (!response.ok) {
              throw new Error(response.statusText);
          }

          const outOfStock = document.querySelector('#outOfStock');
          const contentType = response.headers.get('Content-Type');
          const htmlContent = await response.text();

          if (contentType.includes('text/html')) {
              if (!outOfStock.classList.contains('hidden'))
              outOfStock.classList.add('hidden');
              
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlContent, 'text/html');
              window.checkout_data = JSON.parse(doc.querySelector('#checkoutDetailsJson').textContent);
              const respCheckoutPayment = doc.querySelector('#checkoutPaymentTemplate');
              const respCheckoutCoupon = doc.querySelector('checkout-coupon');

              if (respCheckoutPayment) {
                  this.checkoutAddressTemplate.classList.add('hidden');
                  this.checkoutShippingTemplate.classList.add('hidden');
                  this.checkoutPaymentTemplate.classList.remove('hidden');
                  this.checkoutCoupon.innerHTML = respCheckoutCoupon.innerHTML;
                  this.checkoutPaymentTemplate.innerHTML = respCheckoutPayment.innerHTML;
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  this.removeLoading();
                  this.continueToPaymentPage();
              }
          } else if (contentType.includes('text/json')) {
              const jsonContent = JSON.parse(htmlContent);
              outOfStock.textContent = jsonContent.message;
              outOfStock.classList.remove('hidden');
          }
      }

      continueToPaymentPage() {
          this.dispatchPage.classList.remove('border-b', 'border-color');
          this.dispatchPage.classList.add('opacity-45');
          this.reviewOrderPage.classList.add('border-b', 'border-color');
          this.reviewOrderPage.classList.remove('opacity-45');
      }

      setLoading() {
          this.overlay.classList.remove('hidden');
      }
      
      removeLoading() {
          this.overlay.classList.add('hidden');
      }
  }

  if (!customElements.get('checkout-dispatch')) {
    customElements.define('checkout-dispatch', CheckoutDispatch);
  }
})();
