(() => {
  class PaymentStatus extends HTMLElement {

      connectedCallback() {
          this.paymentSuccess = this.querySelector('#payment-success');
          this.paymentFailure = this.querySelector('#payment-error');
          this.paymentStatusUrl = window.location.search;
          const urlparams = new URLSearchParams(this.paymentStatusUrl);
          const zcm_error_message = urlparams.get('zcm_error_message');

          if (zcm_error_message) {
              this.paymentSuccess.classList.add('hidden');
              this.paymentFailure.classList.remove('hidden');
              this.errorDisplay = document.querySelector('#errorDisplay');
              this.errorDisplay.innerHTML = zcm_error_message;
          } else {
              this.paymentFailure.classList.add('hidden');
              this.paymentSuccess.classList.remove('hidden');
          }
      }
  }

  if (!customElements.get('payment-status')) {
    customElements.define('payment-status', PaymentStatus);
  }
})();
