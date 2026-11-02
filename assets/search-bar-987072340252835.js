import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class SearchBar extends HTMLElement {
      constructor() {
          super();
          this.input = this.querySelector('[data-search-input]');
          this.organizationId = this.querySelector('[name=organization_id]')?.value || '';
          this.debouncedSearchResults = this.debounce(this.getSearchResults, 400);
          this.iconLoader = this.querySelector('#icon-page-loader');
          this.searchElement = this.querySelector('[data-search-result]');
          this.initialPanel = this.querySelector('[data-search-initial]');
          this.searchIcon = document.querySelector('#searchIcon');
          this.searchOverlay = document.querySelector('#searchOverlay');
          this.searchOverlayBackdrop = null;
          this.searchOverlayContainer = null;
          this.mobileBackButton = this.querySelector('[data-search-back]');
          this.dataUrl = this.input?.getAttribute('data-url');
          this.searchRequestToken = 0;

          if (this.input) {
              this.input.addEventListener('input', this.onInput);
              this.input.addEventListener('search', this.onInput);
          }
      }

      connectedCallback() {
          this.searchOverlayBackdrop = document.querySelector('#searchOverlayBackdrop');
          this.searchOverlayContainer = document.querySelector('#searchOverlayContainer');

          this.searchOverlayBackdrop?.addEventListener('click', (event) => {
              event.stopPropagation();
              this.closeSearchOverlay();
          });

          this.searchOverlay?.addEventListener('click', (event) => {
              if (event.target === this.searchOverlay || event.target === this.searchOverlayBackdrop) {
                  this.closeSearchOverlay();
              }
          });

          this.searchOverlayContainer?.addEventListener('click', (event) => {
              event.stopPropagation();
          });

          this.searchIcon?.addEventListener('click', (event) => {
              event.stopPropagation();
              this.openSearchOverlay();
          });

          this.mobileBackButton?.addEventListener('click', () => {
              this.closeSearchOverlay();
          });

          document.addEventListener('keydown', (event) => {
              if (event.key === 'Escape' && !this.searchOverlay?.classList.contains('hidden')) {
                  this.closeSearchOverlay();
              }
          });

          this.pendingTabDirection = null;
          this.searchOverlayContainer?.addEventListener('keydown', (event) => {
              if (event.key === 'Tab') {
                  this.pendingTabDirection = event.shiftKey ? 'backward' : 'forward';
              }
          });

          document.addEventListener('focusin', (event) => {
              if (!this.searchOverlay || this.searchOverlay.classList.contains('hidden')) {
                  return;
              }
              if (event.target === this.searchIcon) {
                  return;
              }
              if (this.searchOverlayContainer?.contains(event.target)) {
                  return;
              }
              const direction = this.pendingTabDirection;
              this.pendingTabDirection = null;

              this.closeSearchOverlay();

              if (direction === 'forward') {
                  const next = this.getNextFocusableAfterSearchIcon();
                  (next || this.searchIcon)?.focus();
              }
          });

          if (this.searchOverlay) {
              const observer = new MutationObserver(() => {
                  if (!this.searchOverlay.classList.contains('hidden')) {
                      setTimeout(() => this.input?.focus(), 100);
                  }
              });
              observer.observe(this.searchOverlay, { attributes: true, attributeFilter: ['class'] });
          }
      }

      getNextFocusableAfterSearchIcon = () => {
          if (!this.searchIcon) {
              return null;
          }
          const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled])';
          const isVisible = (el) => el.offsetParent !== null || el.getClientRects().length > 0;
          let sib = this.searchIcon.nextElementSibling;
          while (sib) {
              if (isVisible(sib)) {
                  if (sib.matches(focusableSelector)) {
                      return sib;
                  }
                  const inside = Array.from(sib.querySelectorAll(focusableSelector)).find(isVisible);
                  if (inside) {
                      return inside;
                  }
              }
              sib = sib.nextElementSibling;
          }
          return null;
      };

      showInitialPanel = () => {
          this.initialPanel?.classList.remove('hidden');
          this.searchElement?.classList.add('hidden');
          this.searchElement?.classList.remove('flex');
          this.iconLoader?.classList.add('hidden');
          this.iconLoader?.classList.remove('flex');
      };

      showResultsPanel = () => {
          this.initialPanel?.classList.add('hidden');
          this.searchElement?.classList.remove('hidden');
          this.searchElement?.classList.add('flex');
      };

      syncSearchQueryInResults = (query) => {
          const value = typeof query === 'string' ? query.trim() : '';
          this.searchElement?.querySelectorAll('[data-search-query-text]').forEach((textEl) => {
              textEl.textContent = value;
          });
      };

      openSearchOverlay = () => {
          if (this.searchOverlay) {
              this.searchOverlay.classList.remove('hidden');
              this.searchOverlayBackdrop?.classList.remove('search-backdrop-exit');
              this.searchOverlayBackdrop?.classList.add('search-backdrop-enter');
              this.searchOverlayContainer?.classList.remove('search-container-exit');
              this.searchOverlayContainer?.classList.add('search-container-enter');
              document.body.style.overflow = 'hidden';
              this.showInitialPanel();
              setTimeout(() => this.input?.focus(), 100);
          }
      };

      closeSearchOverlay = () => {
          if (this.searchOverlay) {
              this.searchOverlayBackdrop?.classList.remove('search-backdrop-enter');
              this.searchOverlayBackdrop?.classList.add('search-backdrop-exit');
              this.searchOverlayContainer?.classList.remove('search-container-enter');
              this.searchOverlayContainer?.classList.add('search-container-exit');

              setTimeout(() => {
                  this.searchOverlay.classList.add('hidden');
                  document.body.style.overflow = '';
                  this.resetSearchResults();
                  this.showInitialPanel();
                  if (this.input) {
                      this.input.value = '';
                  }
              }, 300);
          }
      };

      getCurrentSearchQuery = () => {
          return (this.input?.value || '').trim();
      };

      isSearchQueryCurrent = (query) => {
          return query === this.getCurrentSearchQuery();
      };

      resetSearchResults = () => {
          this.searchRequestToken += 1;
          this.debouncedSearchResults.cancel?.();
          if (this.searchElement) {
              this.searchElement.innerHTML = '';
          }
          this.iconLoader?.classList.add('hidden');
          this.iconLoader?.classList.remove('flex');
      };

      onInput = (event) => {
          this.searchText = event.target.value.trim();
          if (this.searchText === '') {
              this.resetSearchResults();
              this.showInitialPanel();
              return;
          }
          this.debouncedSearchResults(this.searchText);
      };

      debounce(searchResultFunc, delay) {
          let timeout;
          const debounced = (...args) => {
              clearTimeout(timeout);
              timeout = setTimeout(() => searchResultFunc.apply(this, args), delay);
          };
          debounced.cancel = () => {
              clearTimeout(timeout);
          };
          return debounced;
      }

      getSearchResults(input) {
          const query = typeof input === 'string' ? input.trim() : '';
          if (!query || !this.isSearchQueryCurrent(query)) {
              return;
          }

          const requestId = ++this.searchRequestToken;

          this.showResultsPanel();
          this.iconLoader?.classList.remove('hidden');
          this.iconLoader?.classList.add('flex');

          zcAdapter.fetch(`${this.dataUrl}/home/search?q=${encodeURIComponent(query)}&organization_id=${this.organizationId}`)
          .then((response) => {
              if (requestId !== this.searchRequestToken || !this.isSearchQueryCurrent(query)) {
                  return null;
              }
              if (!response.ok) {
                  throw new Error(response.status);
              }
              return response.text();
          })
          .then((json) => {
              if (requestId !== this.searchRequestToken || !this.isSearchQueryCurrent(query)) {
                  return;
              }
              this.iconLoader?.classList.add('hidden');
              this.iconLoader?.classList.remove('flex');
              if (!json) {
                  return;
              }
              const jsonData = JSON.parse(json);
              const resultsMarkup = jsonData.sections['search-result'];
              if (!resultsMarkup || !this.searchElement) {
                  return;
              }
              if (requestId !== this.searchRequestToken || !this.isSearchQueryCurrent(query)) {
                  return;
              }
              this.searchElement.innerHTML = new DOMParser().parseFromString(resultsMarkup, 'text/html').body.innerHTML;
              this.syncSearchQueryInResults(query);
              if (typeof window.zcDispatchStorefrontEvent === 'function') {
                  const resultRows = this.searchElement.querySelectorAll('.search-product-row').length;
                  window.zcDispatchStorefrontEvent('zc-search-predictive-results-success', {
                      query: query,
                      resultCount: resultRows,
                  });
              }
          })
          .catch((error) => {
              if (requestId !== this.searchRequestToken || !this.isSearchQueryCurrent(query)) {
                  return;
              }
              console.error('Search error:', error);
              this.iconLoader?.classList.add('hidden');
              this.iconLoader?.classList.remove('flex');
              if (typeof window.zcDispatchStorefrontEvent === 'function') {
                  window.zcDispatchStorefrontEvent('zc-search-predictive-results-error', {
                      query: query,
                  });
              }
          });
      }

      disconnectedCallback() {
          this.searchIcon?.removeEventListener('click', this.openSearchOverlay);
      }
  }

  if (!customElements.get('search-bar')) {
    customElements.define('search-bar', SearchBar);
  }
})();
