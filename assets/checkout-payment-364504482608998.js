import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class CheckoutPayment extends HTMLElement {
      constructor() {
          super();
         
          this.paymentRadios = this.querySelectorAll('.payment-radio span');
          this.makePaymentBtn = this.querySelector('#makePaymentBtn');
          this.completeOrderBtn = this.querySelector('#completeOrderBtn');
          this.isEmptyPaymentMethods = this.querySelector('#isEmptyPaymentMethods');
      
          this.editShippingBilling = this.querySelector('#editShippingBilling');
          this.editShipping = this.querySelector('#editShipping');
          this.addressId = this.querySelector('[data-selected-address-id]');
          this.editBilling = this.querySelector('#editBilling');
          this.editShippingMethods = this.querySelector('#editShippingMethods');

          this.checkoutAddressTemplate = document.querySelector('#checkoutAddressTemplate');
          this.checkoutShippingTemplate = document.querySelector('#checkoutShippingTemplate');
          this.checkoutPaymentTemplate = document.querySelector('#checkoutPaymentTemplate');

          this.offlineServiceCharge = document.querySelector('.offlineServiceCharge');
          this.offlineCharge = document.querySelector('#offlineCharge');
          this.offlinePaymentCharge = document.querySelectorAll('.offlinePaymentCharge');
          this.offlineChargeDetail = document.querySelector('#offlineChargeDetail');

          this.shippingChargeDetail = document.querySelector('#shippingChargeDetail');
          this.shippingCharge = document.querySelector('#shippingCharge');

          this.showShippingDetails = document.querySelector('#showShippingDetails');
          this.hideShippingDetails = document.querySelector('#hideShippingDetails');
          
          this.inputOffinleCharge = document.querySelector('input[name="formOfflineCharge"]');
          this.totalAmount = document.querySelector('#toalAmount');
          this.couponAppliedValue = document.querySelector('#couponAppliedValue');
          this.formTax = document.querySelector('#formTax');
          this.formSubtotal = document.querySelector('#formSubtotal');

          this.addressPage = document.querySelector('#addressPage');
          this.dispatchPage = document.querySelector('#dispatchPage');
          this.paymentPage = document.querySelector('#reviewOrderPage');
      }

      connectedCallback() {
          this.overlay = this.querySelector('[page-loader]');
          this.isShowDetails = false;

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

                  if (!respAddress) {
                      console.error("Address template missing in response");
                      return false;
                  }

                  this.checkoutAddressTemplate.innerHTML = respAddress.innerHTML;

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
                  this.previousPage('addressPage');
              });
          } else {
              this.editShipping?.addEventListener('click', async () => {
                  const loaded = await this.loadAddressSection();
                  if (!loaded) return;
                  const addreddInput = document.querySelector(`[data-address-id="${this.addressId}"]`);
                  if (addreddInput) {
                      document.querySelector(`[data-address-id="${this.addressId}"]`).checked = true;
                  }
                  this.previousPage('addressPage');
              });
      
              this.editBilling?.addEventListener('click', async () => {
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
                  this.previousPage('addressPage');
              });
          }
          
          if (this.editShippingMethods) {
              this.editShippingMethods.addEventListener('click', () => {
                  this.checkoutAddressTemplate.classList.add('hidden');
                  this.checkoutShippingTemplate.classList.remove('hidden');
                  this.checkoutPaymentTemplate.classList.add('hidden');
                  this.previousPage('dispatchPage');
              });
          }

          this.paymentRadios.forEach((payments) => {
              payments.addEventListener("click", () => {
                  this.paymentRadios.forEach(otherRadio => {
                      if (otherRadio !== payments) {
                          otherRadio.classList.remove('before:scale-100');
                          this.querySelector(`#payment_${otherRadio.getAttribute('value')}`).removeAttribute('checked');
                      } else {
                          this.querySelector(`#payment_${otherRadio.getAttribute('value')}`).setAttribute('checked', 'checked');
                      }

                      if (!this.isEmptyPaymentMethods.classList.contains('hidden')) {
                          this.isEmptyPaymentMethods.classList.add('hidden');
                      }
                      payments.classList.add('before:scale-100');
                  });
                  
                  const currencySymbol = payments.getAttribute('data-currency-symbol');
                  const subTotal = this.regexValidation(this.formSubtotal.textContent);
                  const tax = this.regexValidation(this.formTax.textContent);
                  const shippingCharge = this.regexValidation(this.shippingCharge.textContent);
                  const total = subTotal + tax + shippingCharge;
                  let coupon = this.couponAppliedValue.getAttribute('data-discount');
                  if (coupon) {
                      coupon = this.regexValidation(coupon);
                  }
                  
                  if (payments.getAttribute('data-offline-payment') === 'true') { // offline payment
                      const offlinePaymentCharge = payments.getAttribute('data-offline-charge');
                      this.offlinePaymentCharge.forEach(offlineServiceCharge => {
                          offlineServiceCharge.textContent = currencySymbol + offlinePaymentCharge;
                      });
                      this.inputOffinleCharge.textContent = offlinePaymentCharge;
                      this.completeOrderBtn.classList.remove('hidden');
                      this.makePaymentBtn.classList.add('hidden');
                      this.paymentUrl = payments.getAttribute('data-payment-url');
                      this.paymentMode = 'Offline';
                      const totalValue = coupon ? (parseFloat(offlinePaymentCharge) + total) - coupon : (parseFloat(offlinePaymentCharge) + total);
                      this.totalAmount.textContent = `${currencySymbol}${totalValue.toFixed(2)}`;
                      this.handlePaymentOptions();
                  } else {
                      this.paymentMode = 'Online';
                      this.completeOrderBtn.classList.add('hidden');
                      this.makePaymentBtn.classList.remove('hidden');
                      this.paymentUrl = payments.getAttribute('data-payment-url');
                      if (coupon) {
                          this.totalAmount.textContent = `${currencySymbol}${(total - coupon).toFixed(2)}`;
                      } else {
                          this.totalAmount.textContent = `${currencySymbol}${(total).toFixed(2)}`;
                      }
                      this.handlePaymentOptions(); 
                  }
              });
          });

          const firstSpan = this.paymentRadios[0]; 
          const radio = firstSpan.closest('.payment-radio').querySelector('input[type="radio"]');
          radio.checked = true;
          firstSpan.dispatchEvent(new Event('click'));

          if (this.showShippingDetails || this.hideShippingDetails) {
              this.showHideShippingDetails();
          }

          this.paymentForm = this.querySelector('#paymentForm');
          this.paymentForm.addEventListener('submit', this.makePayments);
      }

      showHideShippingDetails() {
          this.showShippingDetails.addEventListener("click", () => {
              this.isShowDetails = true;
              this.handlePaymentOptions();
              this.showShippingDetails.classList.add('hidden');
              this.hideShippingDetails.classList.remove('hidden');
          });

          this.hideShippingDetails.addEventListener("click", () => {
              this.isShowDetails = false;
              this.handlePaymentOptions();
              this.showShippingDetails.classList.remove('hidden');
              this.hideShippingDetails.classList.add('hidden');
          });
      }

      previousPage(page) {
          if (page === 'addressPage') {
              this.addressPage.classList.add('border-b', 'border-color');
              this.addressPage.classList.remove('opacity-45');
      
              this.dispatchPage.classList.remove('border-b', 'border-color');
              this.dispatchPage.classList.add('opacity-45');   
          } else {
              this.addressPage.classList.remove('border-b', 'border-color');
              this.addressPage.classList.add('opacity-45');
      
              this.dispatchPage.classList.add('border-b', 'border-color');
              this.dispatchPage.classList.remove('opacity-45');
          }

          this.paymentPage.classList.remove('border-b', 'border-color');
          this.paymentPage.classList.add('opacity-45');
      }
      
      regexValidation(textContent) {
          textContent = textContent.replace(/^[^\d]*(\d+(?:\.\d*)?)$/, "$1");
          return parseFloat(textContent);
      }

      handlePaymentOptions() {
          if (!this.isShowDetails && this.paymentMode === 'Offline') {
              this.shippingCharge.classList.remove('hidden');
              this.shippingChargeDetail.classList.add('hidden');
              this.offlineCharge.classList.remove('hidden');
              this.offlineChargeDetail.classList.add('hidden');
              this.offlineServiceCharge.classList.remove('hidden');
          } else if (this.isShowDetails && this.paymentMode === 'Offline') {
              this.shippingCharge.classList.add('hidden');
              this.shippingChargeDetail.classList.remove('hidden');
              this.offlineChargeDetail.classList.remove('hidden');
              this.offlineCharge.classList.add('hidden');
              this.offlineServiceCharge.classList.remove('hidden');
          } else if (!this.isShowDetails && this.paymentMode === 'Online') {
              this.shippingCharge.classList.remove('hidden');
              this.shippingChargeDetail.classList.add('hidden');
              this.offlineChargeDetail.classList.add('hidden');
              this.offlineCharge.classList.add('hidden');
              this.offlineServiceCharge.classList.add('hidden');
          } else if (this.isShowDetails && this.paymentMode === 'Online') {
              this.shippingCharge.classList.add('hidden');
              this.shippingChargeDetail.classList.remove('hidden');
              this.offlineChargeDetail.classList.add('hidden');
              this.offlineCharge.classList.add('hidden');
              this.offlineServiceCharge.classList.add('hidden');
          } else if (this.isShowDetails && this.paymentMode === undefined) {
              this.shippingCharge.classList.add('hidden');
              this.shippingChargeDetail.classList.remove('hidden');   
          } else if (!this.isShowDetails && this.paymentMode === undefined) {
              this.shippingCharge.classList.remove('hidden');
              this.shippingChargeDetail.classList.add('hidden');   
          }
      }

      makePayments = async (event) => {
          event.stopPropagation();
          event.preventDefault();

          const formData = new FormData(this.paymentForm);
          const formDataObject = Object.fromEntries(formData.entries());
          const selectedPaymentMode = formDataObject.payment_mode;
          if (!selectedPaymentMode) {
              this.isEmptyPaymentMethods.classList.remove('hidden');
              return;
          }
          if (!this.paymentMode) {
              const selectedInput = this.paymentForm.querySelector(`#payment_${selectedPaymentMode}`);
              const paymentSpan = selectedInput?.closest('.payment-radio')?.querySelector('span');
              const isOffline = paymentSpan?.getAttribute('data-offline-payment') === 'true';
              this.paymentMode = isOffline ? 'Offline' : 'Online';
              this.paymentUrl = paymentSpan?.getAttribute('data-payment-url');
          }
          if (this.paymentMode === 'Online' && this.paymentUrl === undefined) {
              this.isEmptyPaymentMethods.classList.remove('hidden');
              return;
          }

          const estimateId = this.dataset.estimateId;
          const checkoutId = this.dataset.checkoutId;
          let url = 'checkout/offlinepayment'

          if (estimateId) {
              url += `?checkout_id=${checkoutId}`
          }

          if (this.paymentMode === 'Offline') {
              this.setLoading();
              try {
                  const response = await zcAdapter.fetch(url, {
                      method: 'POST',
                      body: JSON.stringify(formDataObject)
                  });
              
                  const responseData = await response.json();
                  window.location.href = responseData.redirect_url;
              } catch (error) {
                  console.error('Error:', error);
              } finally {
                  this.removeLoading();
              }
          } else {
              window.location.href = this.paymentUrl;
          }
      }

      setLoading() {
          this.overlay.classList.remove('hidden');
      }
      
      removeLoading() {
          this.overlay.classList.add('hidden');
      }
  }

  if (!customElements.get('checkout-order-payment')) {
    customElements.define('checkout-order-payment', CheckoutPayment);
  }
})();
