import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class ReviewsRatings extends HTMLElement {
    constructor() {
      super();
      this.selectedRating = 0;
      this.isEditing = false;
      this.currentPage = 1;
    }

    connectedCallback() {
      this.productId = this.dataset.productId;
      this.cacheElements();
      if (this.productId) {
        this.fetchReviews(this.currentPage);
      }
    }

    disconnectedCallback() {
      this.removeEvents();
    }

    cacheElements() {
      this.reviewForm = this.querySelector('#reviewForm');
      this.titleInput = this.querySelector('#reviewTitle');
      this.contentInput = this.querySelector('#reviewContent');
      this.stars = this.querySelectorAll('#ratingStars .star');

      this.titleError = this.querySelector('#reviewTitleError');
      this.ratingError = this.querySelector('#ratingError');
      this.contentError = this.querySelector('#reviewContentError');

      this.reviewsList = this.querySelector('#reviewsList');
      this.reviewsItems = this.querySelector('#reviewsItems');
      this.paginationContainer = this.querySelector('#pagination');
      this.loadMoreBtn = this.querySelector('#loadMoreReviewsBtn');
    }

    bindEvents() {
      this.bindStarEvents();

      this.querySelector('#writeReviewBtn')?.addEventListener('click', this.openWriteForm);
      this.querySelector('#editReviewBtn')?.addEventListener('click', this.loadReviewForEdit);
      this.querySelector('#cancelReview')?.addEventListener('click', this.cancelReview);
      this.querySelector('#submitReview')?.addEventListener('click', this.submitReview);

      this.titleInput?.addEventListener('input', this.onTitleInput);
      this.contentInput?.addEventListener('input', this.onContentInput);

      this.loadMoreBtn?.addEventListener('click', this.loadMoreReviews);
    }

    removeEvents() {
      this.querySelector('#writeReviewBtn')?.removeEventListener('click', this.openWriteForm);
      this.querySelector('#editReviewBtn')?.removeEventListener('click', this.loadReviewForEdit);
      this.querySelector('#cancelReview')?.removeEventListener('click', this.cancelReview);
      this.querySelector('#submitReview')?.removeEventListener('click', this.submitReview);

      this.titleInput?.removeEventListener('input', this.onTitleInput);
      this.contentInput?.removeEventListener('input', this.onContentInput);

      this.loadMoreBtn?.removeEventListener('click', this.loadMoreReviews);
    }

    onTitleInput = () => {
      this.titleError?.classList.add('hidden');
    };

    onContentInput = () => {
      this.contentError?.classList.add('hidden');
    };

    openWriteForm = () => {
      this.isEditing = false;
      this.resetForm();
      this.reviewForm?.classList.remove('hidden');
    };

    loadReviewForEdit = async (event) => {
      const button = event.currentTarget;
      this.setLoading(button, true);

      try {
        const response = await zcAdapter.fetch(`/editreview/${this.productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch review');
        }

        const data = await response.json();
        this.isEditing = true;

        this.titleInput.value = data.title || '';
        this.contentInput.value = data.content || '';
        this.selectedRating = Number(data.rating || 0);
        this.paintStars(this.selectedRating);
        this.reviewForm?.classList.remove('hidden');
      } catch (error) {
        console.error('Error loading review:', error);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent('zc-product-review-edit-error', {
            productId: this.productId,
            phase: 'load',
          });
        }
      } finally {
        this.setLoading(button, false);
      }
    };

    cancelReview = () => {
      this.reviewForm?.classList.add('hidden');
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
        rating: Number(this.selectedRating),
        title: this.titleInput.value,
        content: this.contentInput.value
      };

      try {

        const response = await zcAdapter.fetch(`/products/${this.productId}/reviews`, {
          method: this.isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error('Failed to submit review');
        }

        this.reviewForm?.classList.add('hidden');
        this.fetchReviews(this.currentPage);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          const wasEditing = this.isEditing;
          window.zcDispatchStorefrontEvent(
            wasEditing ? 'zc-product-review-edit-success' : 'zc-product-review-add-success',
            { productId: this.productId }
          );
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent(
            this.isEditing ? 'zc-product-review-edit-error' : 'zc-product-review-add-error',
            { productId: this.productId }
          );
        }
      } finally {
        this.setLoading(button, false);
      }
    };

    loadMoreReviews = async (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      const nextPage = Number(button.dataset.page);
      if (Number.isNaN(nextPage) || nextPage <= 0) {
        return;
      }

      this.setLoading(button, true);
      try {
        await this.fetchReviews(nextPage, true);
      } finally {
        this.setLoading(button, false);
      }
    };

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

    resetForm() {
      if (!this.titleInput || !this.contentInput) {
        return;
      }

      this.titleInput.value = '';
      this.contentInput.value = '';
      this.selectedRating = 0;
      this.paintStars(0);
    }

    paintStars(value) {
      this.stars.forEach((star, index) => {
        const isActive = index < value;
        star.setAttribute('fill', isActive ? '#E1AB12' : '#D9D9D9');
      });
    }

    bindStarEvents() {
      this.stars.forEach((star) => {
        star.addEventListener('click', () => {
          this.selectedRating = Number(star.getAttribute('data-value'));
          this.paintStars(this.selectedRating);
          this.ratingError?.classList.add('hidden');
        });
      });
    }

    async fetchReviews(page = 1, append = false) {
      try {
        const response = await zcAdapter.fetch(`/products/${this.productId}/reviews?sections=product-reviews&page=${page}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        const reviewsSection = data.sections?.['product-reviews'];
        if (!reviewsSection) {
          return;
        }

        this.removeEvents();

        if (append) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(reviewsSection, 'text/html');
          const newItems = doc.querySelector('#reviewsItems');
          const newPagination = doc.querySelector('#pagination');

          if (this.reviewsItems && newItems) {
            this.reviewsItems.insertAdjacentHTML('beforeend', newItems.innerHTML);
          }
          if (this.paginationContainer && newPagination) {
            this.paginationContainer.innerHTML = newPagination.innerHTML;
          }
        } else if (this.reviewsList) {
          this.reviewsList.innerHTML = reviewsSection;
        }

        this.currentPage = page;
        this.cacheElements();
        this.bindEvents();
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent('zc-product-reviews-load-success', {
            productId: this.productId,
            page,
          });
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        if (typeof window.zcDispatchStorefrontEvent === 'function') {
          window.zcDispatchStorefrontEvent('zc-product-reviews-load-error', {
            productId: this.productId,
            page,
          });
        }
      }
    }

    validateForm() {
      let isValid = true;

      if (!this.titleInput?.value.trim()) {
        this.titleError?.classList.remove('hidden');
        isValid = false;
      } else {
        this.titleError?.classList.add('hidden');
      }

      if (!this.selectedRating) {
        this.ratingError?.classList.remove('hidden');
        isValid = false;
      } else {
        this.ratingError?.classList.add('hidden');
      }

      if (!this.contentInput?.value.trim()) {
        this.contentError?.classList.remove('hidden');
        isValid = false;
      } else {
        this.contentError?.classList.add('hidden');
      }

      return isValid;
    }
  }

  if (!customElements.get('reviews-ratings')) {
    customElements.define('reviews-ratings', ReviewsRatings);
  }
})();
