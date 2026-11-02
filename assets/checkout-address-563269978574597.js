import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class CheckoutAddress extends HTMLElement {
      constructor() {
          super();
          this.sameBillingAddress = true;
          this.emptyFormData = [];
          this.invalidFormData = [];
          this.billingCheckbox = this.querySelector('#billingCheckbox');
          this.billingCheckboxElement = this.querySelector('#billingCheckboxElement');
          this.addressListBillingCheckbox = this.querySelector('#addressListBillingCheckbox');
          this.addressListBillingCheckboxElement = this.querySelector('#addressListBillingCheckboxElement');
          this.billingInformation = this.querySelector('#billingInformation');
          this.shippingCountry = this.querySelector('select[name="shippingCountry"]');
          this.shippingState = document.querySelector('.shippingState'); 
          this.shippingStateSelect = document.querySelector('select[name="shippingStateSelect"]'); 
          this.billingCountry = this.querySelector('select[name="billingCountry"]');
          this.billingState = document.querySelector('.billingState'); 
          this.billingStateSelect = this.querySelector('select[name="billingStateSelect"]');
          this.shippingInvalidTelephone = this.querySelector('#shippingInvalidTelephone');
          this.shippingInvalidEmail = this.querySelector("#shippingInvalidEmail");
          this.addressSubmit = this.querySelector('#addressSubmit');
          
          this.checkoutAddressTemplate = document.querySelector('#checkoutAddressTemplate');
          this.checkoutShippingTemplate = document.querySelector('#checkoutShippingTemplate');
          this.requestQuoteTemplate = document.querySelector('#requestQuoteTemplate');
          this.checkoutPaymentTemplate = document.querySelector('#checkoutPaymentTemplate');
          this.checkoutCoupon = document.querySelector('checkout-coupon');

          this.shippingRadios = document.querySelectorAll('input[name="shipping"]');
          this.isEmptyShippingMethods = document.querySelector('#isEmptyShippingMethods');

          this.addressPage = document.querySelector('#addressPage');
          this.dispatchPage = document.querySelector('#dispatchPage');
          this.reviewOrderPage = document.querySelector('#reviewOrderPage');

          this.addNewAddressButton = this.querySelector('#addNewAddress');
          this.isNewAddress = true;
      }

      connectedCallback() {
          this.overlay = this.querySelector('[page-loader]');
          this.billingCheckbox?.checked ? this.disableBillingForms(true) : this.disableBillingForms(false);

          this.addressListBillingCheckbox?.addEventListener("click", (event) => {
              this.isSameAddresListsBilling();

              if (this.addressListBillingCheckbox.checked) {
                  const emptyBillingAddress = this.querySelector('#emptyBillingAddress');
                  emptyBillingAddress?.classList.add('hidden');
              }
          });


          this.shippingCountry?.addEventListener('change', (event) => {
              this.shippingStateSelect.innerHTML = "";
              const selectedOption = event.target.options[event.target.selectedIndex];
              let statesArray = JSON.parse(selectedOption.getAttribute('data-states'));
              if (statesArray !== null && statesArray.length !== 0) {
                  this.shippingState.classList.remove('hidden');
                  let listOfStates = '';
                  listOfStates +=`<option value="">Select State / Province</option>`;
                  statesArray.forEach( states => {
                      listOfStates += `<option value="${states.state_code}">${states.state_name}</option>`;
                  });
                  this.shippingStateSelect.innerHTML = listOfStates;
              } else {
                  this.shippingState.classList.add('hidden');
              }
          });

          this.billingCountry?.addEventListener('change', (event) => {
              this.billingStateSelect.innerHTML = "";
              const selectedOption = event.target.options[event.target.selectedIndex];
              let statesArray = JSON.parse(selectedOption.getAttribute('data-states'));
              if (statesArray !== null && statesArray.length !== 0) {
                  this.billingState.classList.remove('hidden');
                  let listOfStates = '';
                  listOfStates +=`<option value="">Select State / Province</option>`;
                  statesArray.forEach( states => {
                      listOfStates += `<option value="${states.state_code}">${states.state_name}</option>`;
                  });
                  this.billingStateSelect.innerHTML = listOfStates;
              } else {
                  this.billingState.classList.add('hidden');
              }
          });

          if(!this.billingCheckbox.checked) {
              this.billingInformation.classList.remove("hidden");
          } else {
              this.billingInformation.classList.add("hidden");
          }

          this.billingCheckbox?.addEventListener("click", () => {
              const newBillingAddressSection = this.querySelector('#newBillingAdress');
              if (!this.billingCheckbox.checked) {
                  this.sameBillingAddress = false;
                  this.billingInformation.classList.remove("hidden");
                  this.disableBillingForms(false);
                  newBillingAddressSection.classList.remove("hidden");
              } else {
                  this.sameBillingAddress = true;
                  this.billingInformation.classList.add("hidden");
                  newBillingAddressSection.classList.add("hidden")
                  this.disableBillingForms(true);
              }
          });

          this.form = this.querySelector('#addressForm');

          this.addEventListener('submit', (event) => {
              if (event.target.matches('#addressForm')) {
                  this.handleAddressForm(event);
              }
          });


          this.form.addEventListener('input', (event) => {
              const eventName = event.target.getAttribute('name');
              if (this.emptyFormData.includes(eventName)) {
                  const formElement = eventName;
                  const emptyMessage = this.querySelector(`p[id=${formElement}]`);
                  emptyMessage.classList.add('hidden');
                  this.emptyFormData = this.emptyFormData.filter(element => {
                      return element !== formElement;
                  });
              }

              if (eventName === 'shippingTelephone') {
                  this.validatePhone(event);
              }

              this.shippingAddressRadios = this.querySelectorAll('input[name="shipping_address"]');
              this.shippingAddressRadios.forEach(radio => {
                  radio.addEventListener('change', () => {
                      const emptyAddress = this.querySelector('#emptyShippingAddress');
                      emptyAddress?.classList.add('hidden');
                  });
              });

              this.billingAddressRadios = this.querySelectorAll('input[name="billing_address"]');
              this.billingAddressRadios.forEach(radio => {
                  radio.addEventListener('change', () => {
                      const emptyAddress = this.querySelector('#emptyBillingAddress');
                      emptyAddress?.classList.add('hidden');
                  });
              });
          });

          this.addNewAddressButton?.addEventListener('click', this.showNewAddressSection);
      }

      isSameAddresListsBilling = () => {
          const isShowAddressListBilling = this.querySelector('#listOfBillingAddress');
          isShowAddressListBilling.classList.toggle('hidden');
          if (this.addressListBillingCheckbox.checked != true) {
              const billingAddressId = this.addressListBillingCheckbox?.dataset.addressId;
              this.querySelector(`[data-address-id="${billingAddressId}"] input[name="billing_address"]`).checked = true;
          }
      };

      showNewAddressSection = () => {
          const newAddressSection = this.querySelector('#newAddress');
          const listAddressSection = this.querySelector('#listOfAddress');
          const cancelAddressButton = this.querySelector('#cancelBtn');
          const promotionalEmailCheckbox = this.querySelector('#promotionalEmailCheckbox');
          const emptyBillingAddress = this.querySelector('#emptyBillingAddress');
          const emptyShippingAddress = this.querySelector('#emptyShippingAddress');
          this.isNewAddress = true;
          
          this.clearFormValues();

          promotionalEmailCheckbox.addEventListener('click', () => {
              promotionalEmailCheckbox.checked = !promotionalEmailCheckbox.checked;
          });
          
          this.addNewAddressButton.classList.add('hidden');
          this.addressListBillingCheckboxElement.classList.add('hidden');
          
          newAddressSection.classList.remove('hidden');
          listAddressSection.classList.add('hidden');
          cancelAddressButton.classList.remove('hidden');

          this.billingCheckboxElement.classList.remove('hidden');

          emptyBillingAddress?.classList.add('hidden');
          emptyShippingAddress?.classList.add('hidden');

          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          const listBillingEle = this.querySelector('#listOfBillingAddress');
          if (!listBillingEle.classList.contains('hidden')) {
              listBillingEle.classList.add('hidden');
          }
          this.billingCheckbox.checked = true;
          
          cancelAddressButton.addEventListener('click', () => {
              newAddressSection.classList.add('hidden');
              listAddressSection.classList.remove('hidden');
              this.addNewAddressButton.classList.remove('hidden');
              cancelAddressButton.classList.add('hidden');
              this.billingCheckboxElement.classList.add('hidden');
              this.addressListBillingCheckboxElement.classList.remove('hidden');
              window.scrollTo({ top: 0, behavior: 'smooth' });

              if (!this.billingInformation.classList.contains('hidden')) {
                  this.billingInformation.classList.add('hidden');
              }
              this.addressListBillingCheckbox.checked = true;
              this.isNewAddress = false;
          });
      } 

      validatePhone(event) {
          const phoneRegex = /^[0-9 ()-]+$/;
          if (event.target.value !== '' && !this.invalidFormData.includes('shippingInvalidTelephone') && !phoneRegex.test(event.target.value)) {
              this.invalidFormData.push('shippingInvalidTelephone');
              this.shippingInvalidTelephone.classList.remove('hidden');
          } else if (event.target.value === '' || phoneRegex.test(event.target.value)) {
              this.invalidFormData = this.invalidFormData.filter(element => {
                  return element !== 'shippingInvalidTelephone';
              })
              this.shippingInvalidTelephone.classList.add('hidden');
          }
      }

      disableBillingForms(disable) {
          this.getBillingELement = this.billingInformation.querySelectorAll('input, select, textarea');
          this.getBillingELement.forEach(elements => {
              elements.disabled = disable;
          });
      }

      handleAddressForm = async (event) => {
          event.stopPropagation();
          event.preventDefault();

          const selectedSavedAddress = this.querySelector('input[name="shipping_address"]:checked') || null;
          let billingAddress = {};
          let shippingAddress = {};
          let body = {};

          this.sameBillingAddress = this.billingCheckbox.checked;

          if (this.sameBillingAddress) {
              this.billingInformation.classList.add("hidden");
              this.disableBillingForms(true);
          } else {
              this.billingInformation.classList.remove("hidden");
              this.disableBillingForms(false);
          }

          if (selectedSavedAddress == null && !this.isNewAddress) {
              const emptyAddress = document.querySelector('#emptyShippingAddress');
              emptyAddress.classList.remove('hidden');
          }
          
          if (selectedSavedAddress != null) {
              this.addressData = JSON.parse(selectedSavedAddress.value) || {};
              const addressId = this.addressData.address_id;
              let billingAddressId = this.addressData.address_id;

              if (this.addressListBillingCheckbox.checked != true) {
                  const billingAddressEle = this.querySelector('input[name="billing_address"]:checked');
                  if(!billingAddressEle) {
                      const emptyAddress = document.querySelector('#emptyBillingAddress');
                      if (emptyAddress.classList.contains('hidden'))
                      emptyAddress.classList.remove('hidden');
                      return;
                  }
                  this.billingAddressData = JSON.parse(billingAddressEle.value) || {};
                  billingAddressId = this.billingAddressData.address_id;
              }

              body = {
                  "address_id": addressId,
                  "billing_address_id": billingAddressId
              };
              this.setLoading();
          } else {
              const formData = new FormData(this.form);
              const formDataObject = Object.fromEntries(formData.entries());
              const promotionalEmailCheckbox = this.querySelector('#promotionalEmailCheckbox')
              for (let fieldName in formDataObject) {
                  if (formDataObject[fieldName] === "" && !this.emptyFormData.includes(fieldName)) {
                      this.emptyFormData.push(fieldName);
                      this.querySelector(`#${fieldName}`).classList.remove("hidden");
                  }
              }
      
              const emailRegex = /@/;
      
              if (formDataObject['shippingEmail']) {
                  const isValidEmail = emailRegex.test(formDataObject['shippingEmail']);
                  this.shippingInvalidEmail.classList.toggle('hidden', isValidEmail);
                  if (!isValidEmail) return;
              }
             
              if (this.emptyFormData.length !== 0 || this.invalidFormData.length !== 0) {
                  let scrollElement = this.querySelector(`label[for=${this.emptyFormData[0]}]`);
                  scrollElement.scrollIntoView({ behavior: 'smooth' });
                  return;
              }

              if(!this.billingCheckbox.checked) {
                  this.sameBillingAddress = false;
              }

              this.setLoading();
              shippingAddress['first_name'] = formDataObject['shippingFirstName'];
              shippingAddress['last_name'] = formDataObject['shippingLastName'];
              shippingAddress['email_address'] = formDataObject['shippingEmail'];
              shippingAddress['address'] = formDataObject['shippingAddress'];
              shippingAddress['city'] = formDataObject['shippingCity'];
              shippingAddress['country'] = formDataObject['shippingCountry'];
              shippingAddress['state'] = formDataObject['shippingStateSelect']? formDataObject['shippingStateSelect'] : ''; // For country without state eg: Anguilla
              shippingAddress['postal_code'] = formDataObject['shippingZipCode'];
              shippingAddress['telephone'] = formDataObject['shippingTelephone'];
              shippingAddress['same_billing_address'] = this.sameBillingAddress;
      
              if (this.sameBillingAddress) {
                  billingAddress['first_name'] = formDataObject['shippingFirstName'];
                  billingAddress['last_name'] = formDataObject['shippingLastName'];
                  billingAddress['address'] = formDataObject['shippingAddress'];
                  billingAddress['city'] = formDataObject['shippingCity'];
                  billingAddress['country'] = formDataObject['shippingCountry'];
                  billingAddress['state'] = shippingAddress['state'];
                  billingAddress['postal_code'] = formDataObject['shippingZipCode'];
                  billingAddress['telephone'] = formDataObject['shippingTelephone'];
              } else {
                  billingAddress['first_name'] = formDataObject['billingFirstName'];
                  billingAddress['last_name'] = formDataObject['billingLastName'];
                  billingAddress['address'] = formDataObject['billingAddress'];
                  billingAddress['city'] = formDataObject['billingCity'];
                  billingAddress['country'] = formDataObject['billingCountry'];
                  billingAddress['state'] = formDataObject['billingStateSelect']? formDataObject['billingStateSelect'] : ''; // For country without state eg: Anguilla
                  billingAddress['postal_code'] = formDataObject['billingZipCode'];
                  billingAddress['telephone'] = formDataObject['billingTelephone']
              }
              billingAddress['email_address'] = formDataObject['shippingEmail'];
              billingAddress['same_billing_address'] = this.sameBillingAddress;

              body = {
                  "shipping_address": shippingAddress,
                  "billing_address": billingAddress
              };

              if (promotionalEmailCheckbox?.checked) {
                  body.is_consent_agreed = 1;
              }
          }

          const isQuote = this.dataset.isQuote;
          const quoteCheckoutFlow = this.dataset.quoteCheckoutFlow;
          const quoteId = this.dataset.quoteId;
          let url = 'checkout/address';

          if (isQuote === "true") {
              url += `?checkout_id=${quoteId}`;
          }
          const response = await zcAdapter.fetch(url, {
              method: 'PUT',
              body: JSON.stringify(body)
          });
      
          if (!response.ok) {
              throw new Error(response.statusText);
          }
          const outOfStock = this.querySelector('#outOfStock');
          const contentType = response.headers.get('Content-Type');
          const htmlContent = await response.text();

          if (contentType.includes('text/html')) {
              if (!outOfStock.classList.contains('hidden'))
              outOfStock.classList.add('hidden');

              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlContent, 'text/html');
              window.checkout_data = JSON.parse(doc.querySelector('#checkoutDetailsJson').textContent);
              const respCheckoutShipping = doc.querySelector('#checkoutShippingTemplate');
              const respRequestQuote = doc.querySelector('#requestQuoteTemplate');
              const respCheckoutPayment = doc.querySelector('#checkoutPaymentTemplate');
              const respCheckoutCoupon = doc.querySelector('checkout-coupon');

              if (quoteCheckoutFlow === "quote_details" && respCheckoutPayment) {
                  this.checkoutAddressTemplate.classList.add('hidden');
                  this.checkoutShippingTemplate.classList.add('hidden');
                  this.requestQuoteTemplate.classList.add('hidden');
                  this.checkoutPaymentTemplate.classList.remove('hidden');
                  this.checkoutPaymentTemplate.innerHTML = respCheckoutPayment.innerHTML;
                  if (this.checkoutCoupon && respCheckoutCoupon) {
                      this.checkoutCoupon.innerHTML = respCheckoutCoupon.innerHTML;
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  this.removeLoading();
                  this.continueToReviewOrderPage();
                  return;
              }

              if (quoteCheckoutFlow === "quote_request" && respRequestQuote) {
                  this.checkoutAddressTemplate.classList.add('hidden');
                  this.checkoutShippingTemplate.classList.add('hidden');
                  this.requestQuoteTemplate.classList.remove('hidden');
                  this.checkoutPaymentTemplate.classList.add('hidden');
                  this.requestQuoteTemplate.innerHTML = respRequestQuote.innerHTML;
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  this.removeLoading();
                  this.continueToDispatchPage();
                  return;
              }

              if (respCheckoutShipping) {
                  this.checkoutAddressTemplate.classList.add('hidden');
                  this.checkoutShippingTemplate.classList.remove('hidden');
                  this.requestQuoteTemplate.classList.add('hidden');
                  this.checkoutPaymentTemplate.classList.add('hidden');
                  this.checkoutShippingTemplate.innerHTML = respCheckoutShipping.innerHTML;
                  if (this.checkoutCoupon && respCheckoutCoupon) {
                      this.checkoutCoupon.innerHTML = respCheckoutCoupon.innerHTML;
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  this.removeLoading();
                  this.fetchShippingMethods();
                  this.continueToDispatchPage();
                  return;
              }

              this.removeLoading();
          } else if (contentType.includes('text/json')) {
              const jsonContent = JSON.parse(htmlContent);
              outOfStock.textContent = jsonContent.message;
              outOfStock.classList.remove('hidden');
              this.removeLoading();
          }
      };

      fetchShippingMethods() {
          this.shippingRadios.forEach(radio => {
              radio.addEventListener('click', ()=> {
                  if (!this.isEmptyShippingMethods.classList.contains('hidden')) {
                      this.isEmptyShippingMethods.classList.add('hidden');
                  }
              });
          })
      }

      continueToDispatchPage() {
          this.addressPage.classList.remove('border-b', 'border-color');
          this.addressPage.classList.add('opacity-45');

          this.dispatchPage.classList.add('border-b', 'border-color');
          this.dispatchPage.classList.remove('opacity-45');
      }

      continueToReviewOrderPage() {
          this.addressPage.classList.remove('border-b', 'border-color');
          this.addressPage.classList.add('opacity-45');

          this.reviewOrderPage?.classList.add('border-b', 'border-color');
          this.reviewOrderPage?.classList.remove('opacity-45');
      }

      clearFormValues() {
          this.form.querySelectorAll('input, textarea, select').forEach(element => {
              if (element.type === 'radio' || element.type === 'checkbox') {
                  element.checked = false;
              } else if (element.tagName.toLowerCase() === 'select') {
                  element.selectedIndex = 0;
              } else if (!element.readOnly) {
                  element.value = '';
              }
          });
      }

      setLoading() {
          this.overlay.classList.remove('hidden');
      }
      
      removeLoading() {
          this.overlay.classList.add('hidden');
      }
  }

  if (!customElements.get('checkout-user-address')) {
    customElements.define('checkout-user-address', CheckoutAddress);
  }
})();
