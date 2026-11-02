import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class CheckoutCoupon extends HTMLElement {

      connectedCallback() {
          this.loader = document.querySelector('[page-loader]');
          this.selectElements();
          this.addEventListener('submit', this.onApplyBtnClick);
          this.addEventListener('click',this.onRemoveBtnClick);
          this.addEventListener('input',this.hasCouponInput);
          this.initialUIState();
          this.observeCheckoutUpdates();
      }

      selectElements = () =>{
          this.couponForm = this.querySelector('#couponForm');
          this.invalidCoupon = this.querySelector('#invalidCoupon');
          this.couponApplied = this.querySelectorAll('.couponApplied');
          this.couponRemove = this.querySelector('#couponRemove');
          this.emptyCoupon = this.querySelector('#emptyCoupon');
          this.couponCodeInput = this.querySelector('#couponCode');
          this.orderSummaryForm = this.querySelector('#orderSummaryForm');
          this.totalAmount = this.querySelector('#totalAmount');
          this.couponAppliedValue = this.querySelector('#couponAppliedValue');
      }

      onApplyBtnClick = (event) => {
          const form = event.target.closest('#couponForm');
          if (form) {
              event.preventDefault();
              this.applyCoupon(event);
          }
      }

      hasCouponInput = (event) => {
          const input = event.target.closest('#couponCode');
          if (input) {
              this.emptyCoupon?.classList.add('hidden');
              this.invalidCoupon?.classList.add('hidden');
          }
      }

      onRemoveBtnClick = (event) => {
          const removeBtn = event.target.closest('#couponRemove');
          if (removeBtn) {
              event.preventDefault();
              this.removeCoupon(event);
          }
      }

      observeCheckoutUpdates = () => {
          const targetNode = document.querySelector('#checkout-container');
          if (!targetNode) return;
          const observer = new MutationObserver(() => {
              this.selectElements();
          });
          observer.observe(targetNode, { childList: true, subtree: true });
      }

      initialUIState = () => {
          if (!this.couponAppliedValue) return;
          const code = this.couponAppliedValue.getAttribute('data-code') || '';
          if (code) {
              this.couponForm?.classList.add('hidden');
              this.couponApplied.forEach(el => el.classList.remove('hidden'));
          } else {
              this.couponForm?.classList.remove('hidden');
              this.couponApplied.forEach(el => el.classList.add('hidden'));
          }
      }

      toggleLoader(show) {
          if (!this.loader) return;
          if (show) this.loader.classList.remove('hidden');
          else this.loader.classList.add('hidden');
      }

      applyCoupon = async (event) => {
          event.stopPropagation();
          await this.applyOrRemoveCoupon('apply');
      }

      removeCoupon = async (event) => {
          event.stopPropagation();
          await this.applyOrRemoveCoupon('remove');
      }

      applyOrRemoveCoupon = async (action) => {
          if (!this.couponForm) return;

          const formData = new FormData(this.couponForm);
          const formDataObject = Object.fromEntries(formData.entries());

          if (action === 'remove') formDataObject.coupon_code = '';
          else if (action === 'apply' && (!formDataObject.coupon_code || formDataObject.coupon_code.trim() === '')) {
              this.emptyCoupon?.classList.remove('hidden');
              return;
          }

          const MIN_LOADER_MS = 5000;
          const start = Date.now();
          this.toggleLoader(true);

          try {
              const response = await zcAdapter.fetch('checkout/applycoupon', {
                  method: 'PUT',
                  body: JSON.stringify(formDataObject)
              });

              const elapsed = Date.now() - start;
              if (elapsed < MIN_LOADER_MS) {
                  await new Promise(resolve => setTimeout(resolve, MIN_LOADER_MS - elapsed));
              }

              const html = await response.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const scriptTag = Array.from(doc.querySelectorAll('script')).find(s => s.textContent.includes('window.checkout_data'));
              const match = scriptTag.textContent.match(/window\.checkout_data\s*=\s*({.*})/);
              const data = JSON.parse(match[1]);

              this.errorMsg = data.message;

              if (data.code === 1002) {
                  this.invalidCoupon?.classList.remove("hidden");
                  this.invalidCoupon.textContent = data.message || 'Invalid coupon';
              } else if (data.coupon.coupon_code && formDataObject.coupon_code) {
                  this.invalidCoupon?.classList.add("hidden");
                  this.couponForm?.classList.add("hidden");
                  this.querySelector("#couponValue").innerText = data.coupon.coupon_code;
                  this.querySelector("#couponValue")?.setAttribute('data-code', data.coupon.coupon_code);
                  this.couponApplied.forEach(coupon => coupon.classList.remove("hidden"));
                  this.couponAppliedValue?.setAttribute('data-discount', data.coupon.discount || 0);

                  const discountContainer = this.querySelector('#couponDiscount');
                  if (discountContainer) discountContainer.textContent = `-${data.discount_total_formatted}`;

                  const newTotal = `${data.total_formatted}`;
                  this.totalAmount = this.querySelector('#totalAmount');
                  this.totalAmount.textContent = newTotal;
                  this.totalAmount.setAttribute('data-total', newTotal);
              } else {
                  this.invalidCoupon?.classList.add("hidden");
                  this.couponAppliedValue?.setAttribute('data-discount', '');
                  this.couponForm?.classList.remove("hidden");
                  this.couponApplied.forEach(coupon => coupon.classList.add("hidden"));

                  const newTotal = `${data.total_formatted}`;
                  this.totalAmount = this.querySelector('#totalAmount');
                  this.totalAmount.textContent = newTotal;
                  this.totalAmount.setAttribute('data-total', newTotal);

                  const discountContainer = this.querySelector('#couponDiscount');
                  if (discountContainer) discountContainer.textContent = '';
              }
          } catch (error) {
              console.error('Error in applyOrRemoveCoupon:', error);
              this.invalidCoupon?.classList.remove('hidden');
              this.invalidCoupon.textContent = `${this.errorMsg}`;
          } finally {
              this.toggleLoader(false);
          }
      }

      disconnectedCallback(){
          this.removeEventListener('submit', this.onApplyBtnClick);
          this.removeEventListener('click',this.onRemoveBtnClick);
          this.removeEventListener('input',this.hasCouponInput);
      }
  }

  if (!customElements.get('checkout-coupon')) {
    customElements.define('checkout-coupon', CheckoutCoupon);
  }
})();
