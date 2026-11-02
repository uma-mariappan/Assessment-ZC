(() => {
  class SearchList extends HTMLElement {
      constructor() {
          super();
      }

      connectedCallback() {
          const params = new URLSearchParams(window.location.search);
          const query = params.get("q");

          if (query) {
              const searchTextElement = this.querySelector("#searchText");
              if (searchTextElement) {
                  searchTextElement.textContent = `Search results for "${query}"`;
              }
          }

          if (typeof window.zcDispatchStorefrontEvent === 'function') {
              const productEls = this.querySelectorAll('.product-card, [data-product-card], article');
              window.zcDispatchStorefrontEvent('zc-product-listing-load-success', {
                  url: window.location.href,
                  query: query || '',
                  productCount: productEls.length,
                  source: 'search-list'
              });
          }
      }
  }

  if (!customElements.get('search-list')) {
    customElements.define('search-list', SearchList);
}
})();
