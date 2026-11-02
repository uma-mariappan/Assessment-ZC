import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class TabNavigation extends HTMLElement {
      connectedCallback() {
          const path = window.location.pathname;
          this.profileTab = this.querySelector('#profileTab');
          this.ordersTab = this.querySelector('#ordersTab');
          this.quotesTab = this.querySelector('#quotesTab');
          this.addressTab = this.querySelector('#addressTab');
          this.menuToggle = this.querySelector('#accountMenuToggle');
          this.menuDropdown = this.querySelector('#accountMenuDropdown');
          this.menuOpenIcon = this.querySelector('#accountMenuOpenIcon');
          this.menuCloseIcon = this.querySelector('#accountMenuCloseIcon');

          const tabs = [this.profileTab, this.ordersTab, this.quotesTab, this.addressTab].filter(Boolean);

          const showWhiteHideBlack = (tab) => {
            tab.querySelectorAll('[class^="white-"]').forEach(i => i.classList.remove('hidden'));
            tab.querySelectorAll('[class^="black-"]').forEach(i => i.classList.add('hidden'));
          };

          const showBlackHideWhite = (tab) => {
            tab.querySelectorAll('[class^="white-"]').forEach(i => i.classList.add('hidden'));
            tab.querySelectorAll('[class^="black-"]').forEach(i => i.classList.remove('hidden'));
          };

          let activeTab = this.addressTab;
          if (path.includes('/account/orders')) {
              activeTab = this.ordersTab;
          } else if (path.includes('/account/profile')) {
              activeTab = this.profileTab;
          } else if (path.includes('/account/quotes') || path.includes('/account/quoterequests')) {
              activeTab = this.quotesTab;
          } else if (path.includes('/account/addresses')) {
              activeTab = this.addressTab;
          }

          tabs.forEach((tab) => {
              if (tab === activeTab) {
                  tab.classList.remove('body-text-color');
                  tab.classList.add("btn-primary-color", "alt-text-color");
                  showWhiteHideBlack(tab);
                  return;
              }

              tab.classList.add('body-text-color');
              tab.classList.remove("btn-primary-color", "alt-text-color");
              showBlackHideWhite(tab);
          });

          this.fetchCurrentUser();

          if (this.menuToggle && this.menuDropdown) {
              this.menuToggle.addEventListener('click', () => {
                  this.menuDropdown.classList.toggle('hidden');
                  if (this.menuOpenIcon && this.menuCloseIcon) {
                      this.menuOpenIcon.classList.toggle('hidden');
                      this.menuCloseIcon.classList.toggle('hidden');
                  }
              });

              this.menuDropdown.querySelectorAll('a').forEach((link) => {
                  link.addEventListener('click', () => {
                      this.menuDropdown.classList.add('hidden');
                      if (this.menuOpenIcon && this.menuCloseIcon) {
                          this.menuOpenIcon.classList.remove('hidden');
                          this.menuCloseIcon.classList.add('hidden');
                      }
                  });
              });
          }
      }

      async fetchCurrentUser() {
          try {
              const response = await zcAdapter.getPortalUser();
              if (!response.ok) {
                  return;
              }

              const data = await response.json();
              const currentUser = data.current_user;

              if (currentUser && currentUser.zuid) {
                  // Populate account tab navigation user info
                  document.querySelectorAll('[data-account-user-name]').forEach(el => {
                      el.textContent = currentUser.user;
                  });
                  document.querySelectorAll('[data-account-signout-url]').forEach(el => {
                      el.href = currentUser.signout_url;
                  });

                  // Populate accounts-header user info
                  document.querySelectorAll('[data-account-header-user-name]').forEach(el => {
                      el.textContent = currentUser.user;
                  });
                  document.querySelectorAll('[data-account-header-signout-url]').forEach(el => {
                      el.href = currentUser.signout_url;
                  });

                  // Show logged-in header, hide logged-out header
                  const headerWithUser = document.querySelector('#accountHeaderWithUser');
                  const headerNoUser = document.querySelector('#accountHeaderNoUser');
                  if (headerWithUser) {
                      headerWithUser.classList.remove('hidden');
                  }
                  if (headerNoUser) {
                      headerNoUser.classList.add('hidden');
                  }
              } else {
                  const headerNoUser = document.querySelector('#accountHeaderNoUser');
                  const headerWithUser = document.querySelector('#accountHeaderWithUser');
                  if (headerNoUser) {
                      headerNoUser.classList.remove('hidden');
                      headerNoUser.classList.add('flex');
                  }
                  if (headerWithUser) {
                      headerWithUser.classList.add('hidden');
                  }
              }
          } catch (error) {
              
          }
      }
  }

  if (!customElements.get('tab-navigation')) {
    customElements.define('tab-navigation', TabNavigation);
  }
})();
