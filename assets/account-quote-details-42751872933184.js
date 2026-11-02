import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class AccountQuoteDetails extends HTMLElement {
    connectedCallback() {
      this.handleClick = this.handleClick.bind(this);
      this.addEventListener('click', this.handleClick);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.handleClick);
    }

    async handleClick(event) {
      if (event.target.closest('.account-quote-checkout-btn')) {
        this.handleCheckoutClick(event);
      }

      if (event.target.closest('#submitQuoteComment')) {
        this.handleSubmitComment(event);
      }
    }

    async handleSubmitComment(event) {
      event.preventDefault();

      const form = document.getElementById('QuoteCommentForm');
      const textarea = document.getElementById('commentContent');
      const errorEl = form.querySelector('[data-error="comment-empty"]');
      const spinner = event.target.querySelector('.spinner');

      const estimateId = form.dataset.estimateId;
      const comment = textarea.value.trim();

      if (!comment) {
        errorEl.classList.remove('hidden');
        return;
      }

      errorEl.classList.add('hidden');
      spinner.classList.remove('hidden');

      try {

        const response = await zcAdapter.fetch(
          `/estimate/${estimateId}/comments?comment=${comment}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to post comment');
        }

        // Optional: refresh page or append comment dynamically
        textarea.value = '';
        //window.location.reload();

      } catch (error) {
        console.error('Comment post error:', error);
      } finally {
        spinner.classList.add('hidden');
      }
    }

    async handleCheckoutClick(event) {
      const button = event.target.closest('.account-quote-checkout-btn');
      if (!button) return;

      const estimateId = button.dataset.estimateId;
      if (!estimateId) return;

      try {

        const response = await zcAdapter.fetch(
          `/estimate/checkout?estimate_id=${estimateId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();
        window.location.href = `/checkout?checkout_id=${data.checkout.checkout_id}`;

      } catch (error) {
        console.error('Checkout error:', error);
      }
    }
  }

  if (!customElements.get('account-quote-details')) {
    customElements.define('account-quote-details', AccountQuoteDetails);
  }
})();
