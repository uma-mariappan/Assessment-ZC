(() => {
  class ProductImages extends HTMLElement {
    connectedCallback() {
      this.mainImage = this.querySelector('[data-active-image]');
      this.bindThumbnailEvents();
    }

    disconnectedCallback() {
      this.querySelectorAll('[data-product-image]').forEach((thumb) => {
        thumb.removeEventListener('click', this.onThumbnailClick);
      });
    }

    bindThumbnailEvents() {
      this.querySelectorAll('[data-product-image]').forEach((thumb) => {
        thumb.removeEventListener('click', this.onThumbnailClick);
        thumb.addEventListener('click', this.onThumbnailClick);
      });
    }

    onThumbnailClick = (event) => {
      const button = event.currentTarget;
      const imageUrl = button.getAttribute('data-image-url') || button.getAttribute('src');

      if (this.mainImage && imageUrl) {
        const mainPicture = this.mainImage.closest('picture');
        if (mainPicture) {
          mainPicture.querySelectorAll('source').forEach((s) => s.remove());
        }
        this.mainImage.src = imageUrl;
        this.mainImage.removeAttribute('srcset');
      }

      this.querySelectorAll('[data-product-image]').forEach((thumb) => {
        thumb.classList.remove('border-[#CF93A6]');
        thumb.classList.add('border-[#ECD5DD]');
      });

      button.classList.remove('border-[#ECD5DD]');
      button.classList.add('border-[#CF93A6]');
    };

    /**
     * Update the gallery images when a variant is selected.
     * @param {Object} variant - Variant node, may contain cover_media and media[]
     * @param {Object} product - Product node, used as fallback for images
     */
    updateVariantImages(variant, product) {
      const featuredMedia = variant.cover_media || product.cover_media;
      const media = (variant.media && variant.media.length > 0) ? variant.media : product.media;

      if (!featuredMedia && (!media || media.length === 0)) return;

      // Update main image
      const mainImageUrl = featuredMedia ? featuredMedia.url : (media && media.length > 0 ? media[0].url : null);
      if (mainImageUrl && this.mainImage) {
        this.mainImage.src = mainImageUrl;

        const mainPicture = this.mainImage.closest('picture');
        if (mainPicture && featuredMedia && featuredMedia.resolutions) {
          this.updatePictureSources(mainPicture, featuredMedia.resolutions);
        }
      }

      // Rebuild thumbnail strip(s). Pink Beauty has two strips: desktop (data-thumbnails-container) + mobile.
      const containers = this.querySelectorAll('[data-thumbnails-container]');
      containers.forEach((container) => {
        this.rebuildThumbnails(container, media);
      });

      // Re-cache main image and rebind click events
      this.mainImage = this.querySelector('[data-active-image]') || this.querySelector('#mainImage');
      this.bindThumbnailEvents();
    }

    rebuildThumbnails(container, media) {
      if (!container) return;
      if (!media || media.length <= 1) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
      }

      container.classList.remove('hidden');
      container.innerHTML = '';

      media.forEach((image, index) => {
        const imgUrl = image.url || '';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'w-[88px] h-[88px] border p-2 flex items-center justify-center flex-shrink-0 transition-colors';
        button.style.borderColor = index === 0 ? 'var(--color-primary)' : 'var(--color-accent)';
        button.style.backgroundColor = 'var(--color-surface)';
        button.setAttribute('data-product-image', '');
        button.setAttribute('data-image-url', imgUrl);

        const picture = document.createElement('picture');
        picture.className = 'w-full h-full block';

        if (image.resolutions) {
          image.resolutions.forEach((res) => {
            const source = document.createElement('source');
            source.srcset = res.url;
            source.media = `(min-width: ${res.width}px)`;
            source.type = res.format === 'webp' ? 'image/webp' : `image/${res.format}`;
            picture.appendChild(source);
          });
        }

        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = `Thumbnail ${index + 1}`;
        img.height = 88;
        img.loading = 'lazy';
        img.className = 'w-full h-full object-cover object-center';
        picture.appendChild(img);

        button.appendChild(picture);
        container.appendChild(button);
      });
    }

    updatePictureSources(pictureEl, resolutions) {
      pictureEl.querySelectorAll('source').forEach((s) => s.remove());
      if (!resolutions || resolutions.length === 0) return;

      const img = pictureEl.querySelector('img');
      resolutions.forEach((res) => {
        const source = document.createElement('source');
        source.srcset = res.url;
        source.media = `(min-width: ${res.width}px)`;
        source.type = res.format === 'webp' ? 'image/webp' : `image/${res.format}`;
        pictureEl.insertBefore(source, img);
      });
    }
  }

  if (!customElements.get('product-images')) {
    customElements.define('product-images', ProductImages);
}
  document.addEventListener('DOMContentLoaded', () => {
    const review = document.getElementById('overll_ratings');
    const reviewSection = document.getElementById('review_section');

    if (review && reviewSection) {
      review.addEventListener('click', () => {
        reviewSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    }
  });
})();
