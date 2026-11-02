import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class Header extends HTMLElement {

      connectedCallback() {
          this.hamburgerIcon = this.querySelector('#hamburgerIcon');
          this.closeIcon = this.querySelector('#closeIcon');
          this.menuHamburgerIcon = this.querySelector('#menuHamburgerIcon');
          this.menuCloseIcon = this.querySelector('#menuCloseIcon');
          this.headerSidebar = this.querySelector('[data-header-sidebar]');
          this.sidebarOverlay = this.querySelector('[data-sidebar-overlay]');
          this.drawerMenuSection = this.querySelector('#drawerMenuSection');

          this.toggleHeaderSidebar = () => {
              this.hamburgerIcon?.classList.add('hidden');
              this.headerSidebar?.classList.remove('hidden');
              this.headerSidebar?.classList.add('slide-in');
              this.headerSidebar?.classList.remove('slide-out');
              this.sidebarOverlay?.classList.remove('hidden');
              this.closeIcon?.classList.remove('hidden');
              document.body.style.overflow = 'hidden';
          };

          this.closeHeaderSidebar = () => {
              this.closeIcon?.classList.add('hidden');
              this.headerSidebar?.classList.remove('slide-in');
              this.headerSidebar?.classList.add('slide-out');
              this.sidebarOverlay?.classList.add('hidden');
              setTimeout(() => {
                  this.headerSidebar?.classList.add('hidden');
                  this.resetAllSidebarSubViews(true);
              }, 500);
              this.hamburgerIcon?.classList.remove('hidden');
              document.body.style.overflow = '';
          };

          if (this.hamburgerIcon) {
              this.hamburgerIcon.addEventListener('click', this.toggleHeaderSidebar);
          }
          if (this.closeIcon) {
              this.closeIcon.addEventListener('click', this.closeHeaderSidebar);
          }
          if (this.sidebarOverlay) {
              this.sidebarOverlay.addEventListener('click', this.closeHeaderSidebar);
          }
          if (this.menuHamburgerIcon) {
              this.menuHamburgerIcon.addEventListener('click', this.toggleHeaderMenu);
          }
          if (this.menuCloseIcon) {
              this.menuCloseIcon.addEventListener('click', this.closeHeaderMenu);
          }

          // Mobile sidebar sub-views (menu levels + profile)
          this.openSidebarSubView = (view) => {
              if (!view) {
                  return;
              }
              view.classList.remove('hidden', 'slide-out-right');
              view.classList.add('flex', 'slide-in-right');
          };

          this.closeSidebarSubView = (view, immediate = false) => {
              if (!view) {
                  return;
              }
              if (immediate) {
                  view.classList.add('hidden');
                  view.classList.remove('flex', 'slide-in-right', 'slide-out-right');
                  return;
              }
              if (view.classList.contains('hidden')) {
                  return;
              }
              view.classList.remove('slide-in-right');
              view.classList.add('slide-out-right');
              setTimeout(() => {
                  view.classList.add('hidden');
                  view.classList.remove('flex', 'slide-out-right');
              }, 300);
          };

          this.resetAllSidebarSubViews = (immediate = true) => {
              this.headerSidebar?.querySelectorAll('[data-sidebar-menu-view], [data-sidebar-profile-view]').forEach((view) => {
                  this.closeSidebarSubView(view, immediate);
              });
              const mobileConverter = this.headerSidebar?.querySelector('currency-converter');
              if (mobileConverter && typeof mobileConverter.showMainView === 'function') {
                  mobileConverter.showMainView(immediate);
              }
          };

          this.headerSidebar?.addEventListener('click', (event) => {
              const openBtn = event.target.closest('[data-sidebar-open-menu]');
              if (openBtn && this.headerSidebar.contains(openBtn)) {
                  const key = openBtn.getAttribute('data-sidebar-open-menu');
                  const view = this.headerSidebar.querySelector(`[data-sidebar-menu-view="${key}"]`);
                  this.openSidebarSubView(view);
                  return;
              }
              const backBtn = event.target.closest('[data-sidebar-menu-back]');
              if (backBtn && this.headerSidebar.contains(backBtn)) {
                  const view = backBtn.closest('[data-sidebar-menu-view]');
                  this.closeSidebarSubView(view);
              }
          });

          // Wire profile view opener/closer (mobile sidebar)
          const sidebarProfileOpen = this.headerSidebar?.querySelector('[data-sidebar-open-profile]');
          const sidebarProfileBack = this.headerSidebar?.querySelector('[data-sidebar-profile-back]');
          const sidebarProfileView = this.headerSidebar?.querySelector('[data-sidebar-profile-view]');
          sidebarProfileOpen?.addEventListener('click', () => this.openSidebarSubView(sidebarProfileView));
          sidebarProfileBack?.addEventListener('click', () => this.closeSidebarSubView(sidebarProfileView));

          // Account panel — opened by profile icon (desktop)
          this.profileIcon = document.getElementById('profileIcon');
          this.accountPanel = document.getElementById('moreMenuPanel');
          this.accountOverlay = document.getElementById('moreMenuOverlay');
          this.profileView = this.accountPanel?.querySelector('[data-profile-view]');
          this.openProfileViewBtn = this.accountPanel?.querySelector('[data-open-profile-view]');
          this.profileBackBtn = this.accountPanel?.querySelector('[data-profile-back]');

          this.focusFirstIn = (container) => {
              if (!container) {
                  return;
              }
              const focusable = container.querySelector(
                  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
              );
              focusable?.focus();
          };

          this.openAccountPanel = (e) => {
              e?.stopPropagation();
              if (!this.accountPanel) {
                  return;
              }
              this.accountOverlay?.classList.remove('hidden');
              this.accountPanel.classList.remove('hidden', 'slide-out-right');
              this.accountPanel.classList.add('slide-in-right');
              this.profileIcon?.setAttribute('aria-expanded', 'true');
              requestAnimationFrame(() => this.focusFirstIn(this.accountPanel.querySelector('[data-main-view]') || this.accountPanel));
          };

          this.toggleAccountPanel = (e) => {
              e?.stopPropagation();
              if (!this.accountPanel) {
                  return;
              }
              const isOpen = this.profileIcon?.getAttribute('aria-expanded') === 'true';
              if (isOpen) {
                  this.closeAccountPanel();
              } else {
                  this.openAccountPanel(e);
              }
          };

          this.closeAccountPanel = () => {
              if (!this.accountPanel || this.accountPanel.classList.contains('hidden')) {
                  return;
              }
              const focusWasInside = this.accountPanel.contains(document.activeElement);
              this.accountPanel.classList.remove('slide-in-right');
              this.accountPanel.classList.add('slide-out-right');
              this.accountOverlay?.classList.add('hidden');
              this.profileIcon?.setAttribute('aria-expanded', 'false');
              setTimeout(() => {
                  this.accountPanel?.classList.add('hidden');
                  // Reset sub-views instantly (no animation) for next open
                  const converter = this.accountPanel?.querySelector('currency-converter');
                  if (converter && typeof converter.showMainView === 'function') {
                      converter.showMainView(true);
                  }
                  this.closeProfileView(true);
              }, 300);
              if (focusWasInside) {
                  this.profileIcon?.focus();
              }
          };

          this.openProfileView = () => {
              if (!this.profileView) {
                  return;
              }
              this.profileView.classList.remove('hidden', 'slide-out-right');
              this.profileView.classList.add('flex', 'slide-in-right');
              requestAnimationFrame(() => this.focusFirstIn(this.profileView));
          };

          this.closeProfileView = (immediate = false) => {
              if (!this.profileView) {
                  return;
              }
              if (immediate) {
                  this.profileView.classList.add('hidden');
                  this.profileView.classList.remove('flex', 'slide-in-right', 'slide-out-right');
                  return;
              }
              if (this.profileView.classList.contains('hidden')) {
                  return;
              }
              const focusWasInside = this.profileView.contains(document.activeElement);
              this.profileView.classList.remove('slide-in-right');
              this.profileView.classList.add('slide-out-right');
              setTimeout(() => {
                  this.profileView.classList.add('hidden');
                  this.profileView.classList.remove('flex', 'slide-out-right');
              }, 300);
              if (focusWasInside) {
                  this.openProfileViewBtn?.focus();
              }
          };

          this.closeAccountPanelOnEscape = (e) => {
              if (e.key === 'Escape' && this.accountPanel && !this.accountPanel.classList.contains('hidden')) {
                  this.closeAccountPanel();
                  this.profileIcon?.focus();
              }
          };

          if (this.profileIcon && this.accountPanel) {
              this.profileIcon.addEventListener('click', this.toggleAccountPanel);
              this.accountOverlay?.addEventListener('click', this.closeAccountPanel);
              document.addEventListener('keydown', this.closeAccountPanelOnEscape);
          }
          this.openProfileViewBtn?.addEventListener('click', () => this.openProfileView());
          this.profileBackBtn?.addEventListener('click', () => this.closeProfileView());

          // Header spacer — keep page content from hiding behind fixed header
          this.headerSpacer = document.getElementById('headerSpacer');
          this.headerBar = this.querySelector('.header-bar');

          this.updateSpacerHeight();
          this.setupMenubarOverflow();

          window.addEventListener('resize', () => {
              this.updateSpacerHeight();
              this.scheduleMenubarOverflow();
          });

          this.fetchCurrentUser().then(() => this.getCartCall());

          const signinLinks = this.querySelectorAll('a[href="/signin"]');
          signinLinks.forEach(link => {
              const currentPath = window.location.pathname + window.location.search;
              link.href = `/signin?to_url=${currentPath}`;
          });
      }

      toggleHeaderMenu = () => {
          this.menuHamburgerIcon?.classList.add('hidden');
          this.menuCloseIcon?.classList.remove('hidden');

          this.drawerMenuSection?.classList.remove('hidden', 'slide-out');
          this.drawerMenuSection?.classList.add('slide-in');
      }

      closeHeaderMenu = () => {
          this.drawerMenuSection?.classList.remove('slide-in');
          this.drawerMenuSection?.classList.add('slide-out');

          setTimeout(() => {
              this.drawerMenuSection?.classList.add('hidden');
              this.menuHamburgerIcon?.classList.remove('hidden');
              this.menuCloseIcon?.classList.add('hidden');
          }, 500);
      }

      updateSpacerHeight() {
          const headerBarHeight = this.headerBar ? this.headerBar.offsetHeight : this.offsetHeight;
          const topOffset = parseFloat(this.style.top) || 0;
          const totalHeight = topOffset + headerBarHeight;

          if (this.headerSpacer) {
              this.headerSpacer.style.height = totalHeight + 'px';
          }
          document.documentElement.style.setProperty('--header-bottom', totalHeight + 'px');
      }

      setupMenubarOverflow() {
          this.menubar = this.querySelector('[data-menubar]');
          if (!this.menubar) {
              return;
          }
          this.menuItems = Array.from(this.menubar.querySelectorAll('[data-menu-item]'));
          this.moreItem = this.menubar.querySelector('[data-menu-more]');
          this.moreList = this.moreItem?.querySelector('[data-more-list]');
          if (!this.moreItem || !this.moreList) {
              return;
          }

          this.menubarWrapper = this.menubar.parentElement;
          this.layoutMenubarOverflow();
          if (document.readyState !== 'complete') {
              window.addEventListener('load', () => this.layoutMenubarOverflow(), { once: true });
          }
      }

      scheduleMenubarOverflow() {
          if (!this.menubar) {
              return;
          }
          clearTimeout(this._menubarOverflowTimer);
          this._menubarOverflowTimer = setTimeout(() => this.layoutMenubarOverflow(), 100);
      }

      layoutMenubarOverflow() {
          if (!this.menubar || !this.moreItem || !this.moreList) {
              return;
          }


          this.menuItems.forEach((item) => { item.style.display = ''; });
          this.moreItem.classList.add('hidden');
          this.moreList.innerHTML = '';

          if (window.innerWidth < 1024) {
              return;
          }
          const headerInner = this.headerBar?.querySelector('.flex.flex-row');
          if (!headerInner) {
              return;
          }
          const headerInnerWidth = headerInner.clientWidth;

          let leftWidth = 0;
          let rightWidth = 0;
          const wrapperRect = this.menubarWrapper.getBoundingClientRect();
          const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
          Array.from(headerInner.children).forEach((child) => {
              if (child === this.menubarWrapper) {
                  return;
              }
              if (getComputedStyle(child).display === 'none') {
                  return;
              }
              const r = child.getBoundingClientRect();
              const childCenter = r.left + r.width / 2;
              if (childCenter < wrapperCenter) {
                  leftWidth += r.width;
              } else {
                  rightWidth += r.width;
              }
          });
          const safetyGap = 48;
          const available = headerInnerWidth - 2 * Math.max(leftWidth, rightWidth) - safetyGap;
          if (available <= 0) {
              this.moreItem.classList.remove('hidden');
              this.menuItems.forEach((item) => {
                  item.style.display = 'none';
                  this.moreList.appendChild(this.buildOverflowItem(item));
              });
              return;
          }

          const widthOf = (el) => {
              const style = getComputedStyle(el);
              return el.offsetWidth + parseFloat(style.marginLeft || 0) + parseFloat(style.marginRight || 0);
          };
          const itemWidths = this.menuItems.map(widthOf);
          const totalWidth = itemWidths.reduce((a, b) => a + b, 0);

          if (totalWidth <= available) {
              return;
          }

          this.moreItem.classList.remove('hidden');
          const moreWidth = widthOf(this.moreItem);

          let used = moreWidth;
          let cutoff = -1;
          for (let i = 0; i < this.menuItems.length; i++) {
              if (used + itemWidths[i] > available) { cutoff = i; break; }
              used += itemWidths[i];
          }
          if (cutoff === -1) {
              this.moreItem.classList.add('hidden');
              return;
          }

          for (let i = cutoff; i < this.menuItems.length; i++) {
              const item = this.menuItems[i];
              item.style.display = 'none';
              this.moreList.appendChild(this.buildOverflowItem(item));
          }
      }

      buildOverflowItem(menuItem) {
          const topLink = menuItem.querySelector(':scope > div > a');
          const dropdown = menuItem.querySelector(':scope > div.absolute');
          const childUl = dropdown?.querySelector('ul');
          const hasChildren = childUl && childUl.children.length > 0;

          const arrowRightSvg = '<svg width="5" height="10" viewBox="0 0 5 10" fill="none"><path d="M0.86882 0.736328L0.026123 1.44077L2.96239 4.95859L0.026123 8.47641L0.86882 9.18085L4.39322 4.95859L0.86882 0.736328Z" fill="currentColor"/></svg>';

          const li = document.createElement('li');
          li.className = 'group/child relative bg-white h-[50px] flex items-center hover:bg-[#FDF2F8]';

          const a = document.createElement('a');
          a.href = topLink?.getAttribute('href') || '#';
          a.className = 'flex items-center justify-between gap-2 w-full px-5 py-2 text-base cursor-pointer text-[var(--color-text)] group-hover/child:text-[var(--color-heading)]';

          const nameSpan = document.createElement('span');
          nameSpan.className = 'whitespace-nowrap';
          nameSpan.textContent = topLink?.textContent.trim() || '';
          a.appendChild(nameSpan);

          if (hasChildren) {
              const arrowSpan = document.createElement('span');
              arrowSpan.className = 'shrink-0 transition-transform duration-300 ease-in-out group-hover/child:rotate-90 group-focus-within/child:rotate-90';
              arrowSpan.innerHTML = arrowRightSvg;
              a.appendChild(arrowSpan);
          }

          li.appendChild(a);

          if (hasChildren) {
              const flyout = document.createElement('ul');
              flyout.className = 'hidden group-hover/child:block group-focus-within/child:block absolute left-full top-0 bg-white w-[221px] shadow-lg z-50';
              flyout.style.cssText = 'border: 0.5px solid var(--color-primary);';

              Array.from(childUl.children).forEach((childLi) => {
                  const childAnchor = childLi.querySelector(':scope > a');
                  if (!childAnchor) {
                      return;
                  }
                  const subLi = document.createElement('li');
                  subLi.className = 'group/sub h-[50px] flex items-center bg-white hover:bg-[#FDF2F8]';
                  const subA = document.createElement('a');
                  subA.href = childAnchor.getAttribute('href') || '#';
                  subA.className = 'block w-full px-5 py-2 text-sm whitespace-nowrap cursor-pointer text-[var(--color-text)] group-hover/sub:text-[var(--color-heading)]';
                  subA.textContent = childAnchor.textContent.trim();
                  subLi.appendChild(subA);
                  flyout.appendChild(subLi);
              });
              li.appendChild(flyout);
          }

          return li;
      }

      async getCartCall() {
          await this.refreshCartCount();
          await this.getQuoteCount();
      }

      async refreshCartCount() {
          try {
              const cartResponse = await zcAdapter.getStorefrontCart();
              if (!cartResponse.ok) {
                  throw new Error(`Cart API error! Status: ${cartResponse.status}`);
              }
              const contentType = cartResponse.headers.get('content-type') || '';
              if (!contentType.includes('application/json')) {
                  return;
              }

              const cartData = await cartResponse.json();
              const cartCount = cartData.item_count || 0;
              const cartCountEl = this.querySelector('[data-cart-count]');

              if (cartCountEl) {
                  cartCountEl.textContent = cartCount;
                  cartCountEl.classList.toggle('hidden', cartCount <= 0);
              }
          } catch (error) {
          }
      }

      async getQuoteCount() {
          const quoteCountEl = this.querySelector('[data-quote-count]');
          if (!quoteCountEl) {
              return;
          }

          const accounts_enabled = this.getAttribute('data-customer-accounts-enabled') === 'true';
          if (accounts_enabled && !this.portalUserSignedIn) {
              quoteCountEl.textContent = '0';
              quoteCountEl.classList.add('hidden');
              return;
          }

          try {
              const quoteResponse = await zcAdapter.getStorefrontQuote();
              if (!quoteResponse.ok) {
                  throw new Error(`Quote API error! Status: ${quoteResponse.status}`);
              }
              const contentType = quoteResponse.headers.get('content-type') || '';
              if (!contentType.includes('application/json')) {
                  return;
              }

              const quoteData = await quoteResponse.json();
              const quoteCount = quoteData.item_count || 0;
              quoteCountEl.textContent = quoteCount;
              quoteCountEl.classList.toggle('hidden', quoteCount <= 0);
          } catch (error) {
              
          }
      }

      async fetchCurrentUser() {
          const accounts_enabled = this.getAttribute('data-customer-accounts-enabled') === 'true';
          this.portalUserSignedIn = false;
          if (!accounts_enabled) {
              return;
          }

          try {
              const response = await zcAdapter.getPortalUser();
              if (!response.ok) {
                  throw new Error(`User API error! Status: ${response.status}`);
              }

              const data = await response.json();
              const currentUser = data.current_user;
              this.portalUserSignedIn = !!(currentUser && Object.keys(currentUser).length > 0);

              if (this.portalUserSignedIn) {
                  // Desktop panel
                  this.querySelector('#beforeSignIn')?.classList.add('hidden');
                  const afterSignIn = this.querySelector('#afterSignIn');
                  afterSignIn?.classList.remove('hidden');
                  afterSignIn?.classList.add('flex');

                  // Mobile sidebar
                  this.querySelector('#mobileBeforeSignIn')?.classList.add('hidden');
                  const mobileAfterSignIn = this.querySelector('#mobileAfterSignIn');
                  mobileAfterSignIn?.classList.remove('hidden');
                  mobileAfterSignIn?.classList.add('flex');

                  // Populate user name
                  this.querySelectorAll('[data-desktop-user-name]').forEach(el => {
                      el.textContent = currentUser.user;
                  });
                  this.querySelectorAll('[data-mobile-user-name]').forEach(el => {
                      el.textContent = currentUser.user;
                  });

                  // Populate signout URLs
                  this.querySelectorAll('[data-signout-url]').forEach(el => {
                      el.href = currentUser.signout_url;
                  });
              } else {
                  this.showBeforeSignIn();
              }
          } catch (error) {
              this.showBeforeSignIn();
          }
      }

      showBeforeSignIn() {
          const beforeSignIn = this.querySelector('#beforeSignIn');
          beforeSignIn?.classList.remove('hidden');
          beforeSignIn?.classList.add('flex');
          this.querySelector('#afterSignIn')?.classList.add('hidden');

          const mobileBeforeSignIn = this.querySelector('#mobileBeforeSignIn');
          mobileBeforeSignIn?.classList.remove('hidden');
          mobileBeforeSignIn?.classList.add('flex');
          this.querySelector('#mobileAfterSignIn')?.classList.add('hidden');
      }

      disconnectedCallback() {
          this.hamburgerIcon?.removeEventListener('click', this.toggleHeaderSidebar);
          this.closeIcon?.removeEventListener('click', this.closeHeaderSidebar);
          this.sidebarOverlay?.removeEventListener('click', this.closeHeaderSidebar);
          this.profileIcon?.removeEventListener('click', this.toggleAccountPanel);
          this.accountOverlay?.removeEventListener('click', this.closeAccountPanel);
          document.removeEventListener('keydown', this.closeAccountPanelOnEscape);
      }
  }

  if (!customElements.get('app-header')) {
    customElements.define('app-header', Header);
  }
})();
