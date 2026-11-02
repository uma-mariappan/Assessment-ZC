(() => {
  class QuantityCounter extends HTMLElement {
      connectedCallback() {
        this.MINIMUM = 1;
        this.MAXIMUM = Number.MAX_SAFE_INTEGER;
        this.plusButton =  this.querySelector('[name="plus"]');
        if(this.plusButton){
         this.plusButton.addEventListener('click', this.onPlusButtonClick);
        }
        this.minusButton = this.querySelector('[name="minus"]');
        if(this.minusButton){
        this.minusButton.addEventListener('click', this.onMinusButtonClick);
        }
        this.input = this.querySelector('[data-product-quantity]');
        this.input.value = parseInt(this.getAttribute('value'),10) || this.MINIMUM;
        this.previousValue = parseInt(this.input.value, 10);

        this.input.addEventListener('focus', () => {
          this.previousValue = parseInt(this.input.value, 10);
        });
      
        this.input.addEventListener('input', () => {
          this.input.value = this.input.value.replace(/[^0-9]/g, '');
          if (this.input.value.length === 0) {
            this.input.value = '1';
          }
        });

        this.input.addEventListener('change', this.onManualChange);

        this.render();
      }

      disconnectedCallback() {
        this.querySelector('[name="plus"]').removeEventListener('click', this.onPlusButtonClick);
        this.querySelector('[name="minus"]').removeEventListener('click', this.onMinusButtonClick);
        this.input.removeEventListener('change', this.onManualChange);
      }

      isValidValue = (value) => {
        const inputValue = Number(value);
        if( inputValue > this.MAXIMUM || inputValue < this.MINIMUM || isNaN(inputValue)){
          this.errorMsg = this.closest('.cart-item')?.querySelector('.qty-error-msg') || document.querySelector('.qty-error-msg');
          this.errorMsg.classList.remove('hidden');
          return false;
        }
        this.errorMsg?.classList.add('hidden');
        return true;
      }

      onPlusButtonClick = () => {
        let newValue = parseInt(this.input.value, 10) + 1;
        this.input.value = newValue;

        if(!this.isValidValue(this.input.value)) return;

        this.dispatchEvent(new CustomEvent('quantity-data', {
        detail: {
          data: +1,
          newValue,
          variantId: this.dataset.quantityVariantId
        },
        bubbles: true
      }));

      this.previousValue = newValue;
      this.render();
    }

    onMinusButtonClick = () => {
      let newValue = parseInt(this.input.value, 10) - 1;
      if (newValue >= this.MINIMUM) {
          this.input.value = newValue;

          if(!this.isValidValue(this.input.value)) return;

          this.dispatchEvent(new CustomEvent('quantity-data', {
          detail: {
            data: -1,
            newValue,
            variantId: this.dataset.quantityVariantId
          },
          bubbles: true
        }));

        this.previousValue = newValue;
        this.render();
      }
    }

    onManualChange = () => {
        let newValue = parseInt(this.input.value, 10);
        if (isNaN(newValue) || newValue < this.MINIMUM) {
          newValue = this.MINIMUM;
          this.input.value = newValue;
        }

        if(!this.isValidValue(this.input.value)) return;
        const change = newValue - this.previousValue;

        if (change !== 0) {
          this.dispatchEvent(new CustomEvent('quantity-data', {
            detail: {
              data: change,
              newValue,
              variantId: this.dataset.quantityVariantId
            },
            bubbles: true
          }));
        }

        this.previousValue = newValue;
        this.render();
      }

      render() {
        const value = parseInt(this.input.value, 10);
        const greyIcon = this.querySelector('#iconMinusGrey');
        const blackIcon = this.querySelector('#iconMinusBlack');
        const isCartPage = greyIcon?.dataset.cartPage === 'true';

        if (value === this.MINIMUM) {
          greyIcon.classList.remove('hidden');
          blackIcon.classList.add('hidden');
          if (this.minusButton && !isCartPage) {
            this.minusButton.disabled = true;
            this.minusButton.setAttribute('aria-disabled', 'true');
          }
        } else {
          greyIcon.classList.add('hidden');
          blackIcon.classList.remove('hidden');
          if (this.minusButton) {
            this.minusButton.disabled = false;
            this.minusButton.removeAttribute('aria-disabled');
          }
        }
      }
    }

  if (!customElements.get('quantity-counter')) {
    customElements.define('quantity-counter', QuantityCounter);
  }
})();
