(() => {
  class QuoteStatus extends HTMLElement {

      connectedCallback() {
          this.quoteSucess = this.querySelector('#quote-success');
          this.quoteFailure = this.querySelector('#quote-error');
          this.quoteStatusUrl = window.location.search;
          const urlparams = new URLSearchParams(this.quoteStatusUrl);
          const zcm_error_message = urlparams.get('zcm_error_message');

          if (zcm_error_message) {
              this.quoteSucess.classList.add('hidden');
              this.quoteFailure.classList.remove('hidden');
              this.errorDisplay = document.querySelector('#errorDisplay');
              this.errorDisplay.innerHTML =  zcm_error_message;
          } else {
              this.quoteFailure.classList.add('hidden');
              this.quoteSucess.classList.remove('hidden');
          }
      }
  }

  if (!customElements.get('quote-status')) {
    customElements.define('quote-status', QuoteStatus);
}
})();
