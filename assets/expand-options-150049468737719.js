(() => {
  class ExpandOptions extends HTMLElement {
      connectedCallback() {
          this.expandOptions = this.querySelectorAll('.expand-options');

          this.expandOptions.forEach((expandOption) => {
              expandOption.addEventListener('click', this.expandElements);
          });

          // Auto-open the first item
          if (this.expandOptions.length > 0) {
              this.showOptions(this.expandOptions[0]);
          }
      }

      expandElements = (event) => {
          const clickedEvent = event.target.closest('.expand-options');
          const trigger = clickedEvent.querySelector('[data-trigger]');

          // If a data-trigger element exists, only toggle when clicking on it (not on inner content)
          if (trigger && !event.target.closest('[data-trigger]')) {
              return;
          }

          const isClickedEventHide = clickedEvent.querySelector('[data-descp]');

          if (isClickedEventHide.style.maxHeight === "" || isClickedEventHide.style.maxHeight === "0px") {
              this.hideAllOptionsElements(clickedEvent);
              this.showOptions(clickedEvent);
          } else {
              this.hideOptions(clickedEvent);
          }
      }

      async showOptions(clickedEvent) {
          const infoElement = clickedEvent.querySelector('[data-descp]');
          infoElement.style.maxHeight = infoElement.scrollHeight + "px";
          infoElement.style.opacity = "1";

          clickedEvent.querySelector('[data-collapse-option]').classList.remove('hidden');
          clickedEvent.querySelector('[data-expand-option]').classList.add('hidden');

          const trigger = clickedEvent.querySelector('[data-trigger]');
          if (trigger) {
              trigger.setAttribute('aria-expanded', 'true');
          }

          const faqCard = clickedEvent.closest('.faq-card');
          if (faqCard) faqCard.classList.add('faq-active');
      }

      hideOptions(clickedEvent) {
          const infoElement = clickedEvent.querySelector('[data-descp]');
          infoElement.style.maxHeight = "0px";

          clickedEvent.querySelector('[data-collapse-option]').classList.add('hidden');
          clickedEvent.querySelector('[data-expand-option]').classList.remove('hidden');

          const trigger = clickedEvent.querySelector('[data-trigger]');
          if (trigger) {
              trigger.setAttribute('aria-expanded', 'false');
          }

          const faqCard = clickedEvent.closest('.faq-card');
          if (faqCard) faqCard.classList.remove('faq-active');
      }

      hideAllOptionsElements(selectedOption) {
          this.expandOptions.forEach(option => {
              const notDropDownMenu = option.querySelector('[data-descp]') ? option.querySelector('[data-descp]') : false;
              if (option !== selectedOption && notDropDownMenu) {
                  const infoElement = option.querySelector('[data-descp]');
                  infoElement.style.maxHeight = "0px";
                  infoElement.style.opacity = "0";

                  option.querySelector('[data-collapse-option]').classList.add('hidden');
                  option.querySelector('[data-expand-option]').classList.remove('hidden');

                  const trigger = option.querySelector('[data-trigger]');
                  if (trigger) {
                      trigger.setAttribute('aria-expanded', 'false');
                  }

                  const faqCard = option.closest('.faq-card');
                  if (faqCard) faqCard.classList.remove('faq-active');
              }
          });
      }

      disconnectedCallback() {
          this.expandOptions.forEach((option) => {
              option.removeEventListener('click', this.expandElements);
          });
      }
  }

  if (!customElements.get('expand-options')) {
    customElements.define('expand-options', ExpandOptions);
}
})();
