(() => {
  class QuantityMessage extends HTMLElement {
      connectedCallback() {
          this.messageSuccessIcon = this.querySelector('#svg-check-circle');
          this.messageErrorIcon = this.querySelector('#svg-warning');
      }

      showSuccess(message) {
          const quantityStatusMessage = this.querySelector('#quantity-status-message');
          if (!quantityStatusMessage) {
              return
          };
          quantityStatusMessage.textContent = message;
          this.messageSuccessIcon?.classList.remove('hidden');
          this.quantityMessageAnimation();
      }

      showError(message) {
          const quantityStatusMessage = this.querySelector('#quantity-status-message');
          if (!quantityStatusMessage) {
              return;
          }
          quantityStatusMessage.textContent = message;
          this.messageErrorIcon?.classList.remove('hidden');
          this.quantityMessageAnimation();
      }

      quantityMessageAnimation() {
          this.classList.remove('hidden');
          this.classList.remove('animate-slideOut');
          this.classList.add('animate-slideIn');
          setTimeout(() => {
              this.classList.remove('animate-slideIn');
              this.classList.add('animate-slideOut');
              setTimeout(() => {
              this.classList.add('hidden');
              if (this.messageSuccessIcon && !this.messageSuccessIcon.classList.contains('hidden')) {
                  this.messageSuccessIcon.classList.add('hidden');
              }

              if (this.messageErrorIcon && !this.messageErrorIcon.classList.contains('hidden')) {
                  this.messageErrorIcon.classList.add('hidden');
              }
              }, 500);
          }, 2500);
      }
    }

  if (!customElements.get('quantity-message')) {
    customElements.define('quantity-message', QuantityMessage);
}
})();
