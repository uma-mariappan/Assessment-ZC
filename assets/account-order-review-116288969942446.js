import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class AccountOrderReview extends HTMLElement {
    constructor() {
      super();
      this.selectedRating = 5;
    }

    connectedCallback() {
      this.productId = this.dataset.productId;
      this.selectedRating = this.getInitialRating();
      this.cacheElements();
      this.applyRatingVisual();
      this.bindEvents();
    }

    getInitialRating() {
      const rVal = parseInt(new URLSearchParams(window.location.search).get('r_val'), 10);
      return rVal >= 1 && rVal <= 5 ? rVal : 5;
    }

    applyRatingVisual() {
      if (!this.stars) {
        return;
      }
      this.stars.forEach((s) => s.setAttribute('fill', '#e5e7eb'));
      for (let i = 0; i < this.selectedRating; i++) {
        this.stars[i]?.setAttribute('fill', '#f6ac35');
      }
    }

    disconnectedCallback() {
      this.removeEvents();
    }

    cacheElements() {
      this.titleInput = this.querySelector('#reviewTitle');
      this.contentInput = this.querySelector('#reviewContent');
      this.stars = this.querySelectorAll('#ratingStars .star');

      this.titleError = this.querySelector('#reviewTitleError');
      this.ratingError = this.querySelector('#ratingError');
      this.contentError = this.querySelector('#reviewContentError');

      this.reviewFormSection = this.querySelector('#reviewFormSection');
    }

    bindEvents() {
      this.bindStarEvents();
      this.querySelector('#submitReview')?.addEventListener('click', this.submitReview);
      this.querySelector('#cancelReview')?.addEventListener('click', this.cancelReview);
      this.titleInput?.addEventListener('input', () => this.titleError?.classList.add('hidden'));
      this.contentInput?.addEventListener('input', () => this.contentError?.classList.add('hidden'));
    }

    removeEvents() {
      this.querySelector('#submitReview')?.removeEventListener('click', this.submitReview);
      this.querySelector('#cancelReview')?.removeEventListener('click', this.cancelReview);
    }

    bindStarEvents() {
      if (this.stars) {
        this.stars.forEach((star) => {
          star.addEventListener('click', () => {
            this.selectedRating = parseInt(star.getAttribute('data-value'));
            this.applyRatingVisual();
            this.ratingError?.classList.add('hidden');
          });
        });
      }
    }

    cancelReview = () => {
      window.history.back();
    };

    submitReview = async (event) => {
      event.preventDefault();
      const button = event.currentTarget;

      if (!this.validateForm()) {
        return;
      }

      this.setLoading(button, true);

      const body = {
        product_id: this.productId,
        rating: parseInt(this.selectedRating),
        title: this.titleInput.value,
        content: this.contentInput.value,
      };

      try {
        const res = await zcAdapter.fetch('/account/orders/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        window.scrollTo({ top: 0, behavior: 'smooth' });

        const messageElement = document.querySelector('status-message');

        if (!res.ok || data.error) {
          messageElement?.showError(data.error || 'Something went wrong');
          return;
        }

        messageElement?.showSuccess(data.message);
        this.reviewFormSection.classList.add('hidden');
      } catch (err) {
        console.error('Error submitting review:', err);
      } finally {
        this.setLoading(button, false);
      }
    };

    validateForm() {
      let isValid = true;

      if (!this.titleInput?.value?.trim()) {
        this.titleError?.classList.remove('hidden');
        isValid = false;
      } else {
        this.titleError?.classList.add('hidden');
      }

      if (!this.selectedRating || this.selectedRating === 0) {
        this.ratingError?.classList.remove('hidden');
        isValid = false;
      } else {
        this.ratingError?.classList.add('hidden');
      }

      if (!this.contentInput?.value?.trim()) {
        this.contentError?.classList.remove('hidden');
        isValid = false;
      } else {
        this.contentError?.classList.add('hidden');
      }

      return isValid;
    }

    setLoading(button, isLoading) {
      if (!button) {
        return;
      }

      const spinner = button.querySelector('.spinner');

      if (isLoading) {
        button.disabled = true;
        spinner?.classList.remove('hidden');
        button.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        button.disabled = false;
        spinner?.classList.add('hidden');
        button.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }
  }

  if (!customElements.get('account-order-review')) {
    customElements.define('account-order-review', AccountOrderReview);
  }
})();
