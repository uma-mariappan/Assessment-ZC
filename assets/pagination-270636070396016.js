(() => {
  class PaginationBar extends HTMLElement {
      constructor() {
          super();
          this.previousBtn = this.querySelector('#previousPage');
          this.nextBtn = this.querySelector('#nextPage');
          this.perPageContainer = this.querySelector('#perPageContainer');
          this.paginationPages = this.querySelectorAll('.pagination-page');
      }

      connectedCallback() {
          this.previousBtn?.addEventListener('click', (e) => this.onChangePage(e, 'previous'));
          this.nextBtn?.addEventListener('click', (e) => this.onChangePage(e, 'next'));

          const urlParams = new URLSearchParams(window.location.search);
          const perPage = urlParams.get('per_page') || '20';

          if (this.perPageContainer) {
              this.perPageContainer.querySelector('button > span').innerText = `${perPage} per page`;
          }

          this.paginationPages.forEach((pageBtn) => {
              pageBtn.addEventListener('click', () => {
                  this.updateUrl({
                      page: 1,
                      per_page: pageBtn.innerText
                  });
              });
          });

          document.querySelectorAll('[data-page]').forEach(btn => {
              btn.addEventListener('click', () => {
                  this.updateUrl({
                      page: btn.dataset.page,
                      per_page: urlParams.get("per_page") || "20",
                  });
              });
          });
      }

      updateUrl(updates) {
          const params = new URLSearchParams(window.location.search);

          Object.entries(updates).forEach(([key, val]) => {
              params.set(key, val);
          });

          window.location.search = params.toString();
      }

      onChangePage(event, direction) {
          const urlParams = new URLSearchParams(window.location.search);
          const perPage = urlParams.get('per_page') || '20';

          const totalPages = Number(event.target.dataset.totalPages);
          const currentPage = Number(event.target.dataset.currentPage);

          let targetPage = currentPage;

          if (direction === 'previous' && currentPage > 1) {
              targetPage--;
          } else if (direction === 'next' && currentPage < totalPages) {
              targetPage++;
          } else {
              return;
          }

          this.updateUrl({ page: targetPage, per_page: perPage });
      }
  }

  if (!customElements.get('pagination-bar')) {
    customElements.define('pagination-bar', PaginationBar);
}
})();
