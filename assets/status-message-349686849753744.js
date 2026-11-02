(() => {
  class StatusMessage extends HTMLElement {
    connectedCallback() {
      this.messageSuccessIcon = this.querySelector('#svg-check-circle');
      this.messageErrorIcon = this.querySelector('#svg-warning');
    }

    showSuccess(message) {
      const statusMessageText = this.querySelector('#status-message-text');
      if (!statusMessageText) {
        return;
      }
      statusMessageText.textContent = message;
      this.messageSuccessIcon?.classList.remove('hidden');
      this.statusMessageAnimation();
    }

    showError(message) {
      const statusMessageText = this.querySelector('#status-message-text');
      if (!statusMessageText) {
        return;
      }
      statusMessageText.textContent = message;
      this.messageErrorIcon?.classList.remove('hidden');
      this.statusMessageAnimation();
    }

    statusMessageAnimation() {
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

  if (!customElements.get('status-message')) {
    customElements.define('status-message', StatusMessage);
  }
})();
