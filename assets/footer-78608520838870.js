(() => {
  class AppFooter extends HTMLElement {
      connectedCallback() {
          this.expandOptions = this.querySelectorAll('.expand-options');

          if (window.innerWidth < 1024) { // avoid expand in lg (1024px)
              this.expandOptions.forEach((expandOption) => {
                  expandOption.addEventListener('click', this.expandElements);
              });
          }
      }

      expandElements = (event) => {
          const clickedEvent = event.target.closest('.expand-options');
          const infoElement = clickedEvent.querySelector('[data-descp]');
          
          if (infoElement.style.maxHeight === "" || infoElement.style.maxHeight === "0px") {
              this.hideAllFooterElements(clickedEvent);
              this.showFooterElements(clickedEvent);
          } else {
              this.hideFooterElements(clickedEvent);
          }
      }

      showFooterElements(clickedEvent) { 
          // Show the clicked data-descp section
          const infoElement = clickedEvent.querySelector('[data-descp]');
          infoElement.style.maxHeight = infoElement.scrollHeight + "px"; // Expand smoothly
          infoElement.style.opacity = "1";

          clickedEvent.querySelector('[data-hide-info]').classList.remove('hidden');
          clickedEvent.querySelector('[data-show-info]').classList.add('hidden');
      }

      hideFooterElements(clickedEvent) {
          const infoElement = clickedEvent.querySelector('[data-descp]');
          infoElement.style.maxHeight = "0px"; // Collapse smoothly

          clickedEvent.querySelector('[data-hide-info]').classList.add('hidden');
          clickedEvent.querySelector('[data-show-info]').classList.remove('hidden');
      }

      hideAllFooterElements(except) {
          // Hide all other data-descp, data-show-info and data-hide-info elements
          this.expandOptions.forEach(option => {
              if (option !== except) {
                  const infoElement = option.querySelector('[data-descp]');
                  infoElement.style.maxHeight = "0px"; // Collapse smoothly
                  infoElement.style.opacity = "0";

                  option.querySelector('[data-hide-info]').classList.add('hidden');
                  option.querySelector('[data-show-info]').classList.remove('hidden');
              }
          });
      }

      disconnectedCallback() {
          this.expandOptions.forEach((options) => {
              options.removeEventListener('click', this.expandElements);
          });
      }
  }

  if (!customElements.get('app-footer')) {
    customElements.define('app-footer', AppFooter);
}
})();
