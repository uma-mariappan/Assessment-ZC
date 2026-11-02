import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class AccountsHeader extends HTMLElement {
    connectedCallback() {
      this.headerNoUser = this.querySelector('#accountHeaderNoUser');
      this.headerWithUser = this.querySelector('#accountHeaderWithUser');
      this.fetchCurrentUser();
    }

    async fetchCurrentUser() {
      try {
        const response = await zcAdapter.getPortalUser();
        if (!response.ok) {
          this.showNoUser();
          return;
        }
        const data = await response.json();
        const currentUser = data?.current_user;

        if (currentUser && currentUser.zuid) {
          this.querySelectorAll('[data-account-header-user-name]').forEach((el) => {
            el.textContent = currentUser.user;
          });
          this.querySelectorAll('[data-account-header-signout-url]').forEach((el) => {
            el.href = currentUser.signout_url;
          });
          this.showWithUser();
        } else {
          this.showNoUser();
        }
      } catch (err) {
        this.showNoUser();
      }
    }

    showNoUser() {
      if (this.headerNoUser) {
        this.headerNoUser.classList.remove('hidden');
        this.headerNoUser.classList.add('flex');
      }
      if (this.headerWithUser) {
        this.headerWithUser.classList.add('hidden');
      }
    }

    showWithUser() {
      if (this.headerWithUser) {
        this.headerWithUser.classList.remove('hidden');
      }
      if (this.headerNoUser) {
        this.headerNoUser.classList.add('hidden');
      }
    }
  }

  if (!customElements.get('accounts-header')) {
    customElements.define('accounts-header', AccountsHeader);
  }
})();
