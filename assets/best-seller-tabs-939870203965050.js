(() => {
  class BestSellerTabs extends HTMLElement {
    connectedCallback() {
      if (this.dataset.bestSellerReady === 'true') {
        return;
      }

      this.tabs = Array.from(this.querySelectorAll('[data-best-seller-tab]'));
      this.panels = Array.from(this.querySelectorAll('[data-best-seller-panel]'));

      if (!this.tabs.length || !this.panels.length) {
        return;
      }

      this.activeClasses = ['btn-primary', 'btn-primary-color', 'btn-primary-hover'];
      this.inactiveClasses = ['btn-secondary', 'btn-secondary-color', 'btn-secondary-hover'];

      this.onResize = this.onResize.bind(this);

      this.panelFocusableSelector = 'a[href], button, input, select, textarea, [tabindex]';

      this.tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          this.activateTab(tab.getAttribute('data-tab-key'));
        }.bind(this));

        tab.addEventListener('keydown', function (event) {
          if (event.key !== 'Enter') {
            return;
          }
          event.preventDefault();
          this.activateTab(tab.getAttribute('data-tab-key'));
          this.focusFirstInActivePanel();
        }.bind(this));
      }.bind(this));

      this.panels.forEach(function (panel) {
        this.bindPanelScroll(panel);
      }.bind(this));

      this.activateTab(this.tabs[0].getAttribute('data-tab-key'));
      window.addEventListener('resize', this.onResize);

      this.dataset.bestSellerReady = 'true';
    }

    setPanelFocusable(panel, focusable) {
      if (!panel) {
        return;
      }
      var elements = panel.querySelectorAll(this.panelFocusableSelector);
      elements.forEach(function (el) {
        if (focusable) {
          var orig = el.getAttribute('data-bs-orig-tabindex');
          if (orig === null) {
            return;
          }
          if (orig === '') {
            el.removeAttribute('tabindex');
          } else {
            el.setAttribute('tabindex', orig);
          }
          el.removeAttribute('data-bs-orig-tabindex');
        } else {
          if (!el.hasAttribute('data-bs-orig-tabindex')) {
            el.setAttribute('data-bs-orig-tabindex', el.getAttribute('tabindex') || '');
          }
          el.setAttribute('tabindex', '-1');
        }
      });
    }

    focusFirstInActivePanel() {
      var activePanel = this.panels.find(function (p) {
        return !p.classList.contains('hidden');
      });
      if (!activePanel) {
        return;
      }
      this.setPanelFocusable(activePanel, true);
      var first = activePanel.querySelector('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (first) {
        first.focus();
      } 
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.onResize);
    }

    onResize() {
      this.panels.forEach(function (panel) {
        this.updateScrollbar(panel);
      }.bind(this));
    }

    bindPanelScroll(panel) {
      if (!panel || panel.dataset.bestSellerScrollBound === 'true') {
        return;
      }

      var track = panel.querySelector('[data-best-seller-track]');
      if (!track) {
        return;
      }

      track.addEventListener('scroll', function () {
        this.updateScrollbar(panel);
      }.bind(this));

      panel.dataset.bestSellerScrollBound = 'true';
      this.updateScrollbar(panel);
    }

    updateScrollbar(panel) {
      if (!panel) {
        return;
      }

      var track = panel.querySelector('[data-best-seller-track]');
      var bar = panel.querySelector('[data-best-seller-scrollbar]');
      var thumb = panel.querySelector('[data-best-seller-scroll-thumb]');

      if (!track || !bar || !thumb) {
        return;
      }

      var maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);

      if (maxScroll <= 0) {
        bar.classList.add('hidden');
        return;
      }

      bar.classList.remove('hidden');

      var visibleRatio = track.clientWidth / track.scrollWidth;
      var thumbWidthPct = Math.max(visibleRatio * 100, 15);
      if (thumbWidthPct > 100) {
        thumbWidthPct = 100;
      }

      var scrollRatio = track.scrollLeft / maxScroll;
      var maxLeftPct = 100 - thumbWidthPct;
      var thumbLeftPct = scrollRatio * maxLeftPct;

      thumb.style.width = thumbWidthPct + '%';
      thumb.style.left = thumbLeftPct + '%';
    }

    activateTab(targetKey) {
      var self = this;
      this.tabs.forEach(function (tab) {
        var isActive = tab.getAttribute('data-tab-key') === targetKey;
        if (isActive) {
          self.inactiveClasses.forEach(function (cls) { tab.classList.remove(cls); });
          self.activeClasses.forEach(function (cls) { tab.classList.add(cls); });
        } else {
          self.activeClasses.forEach(function (cls) { tab.classList.remove(cls); });
          self.inactiveClasses.forEach(function (cls) { tab.classList.add(cls); });
        }
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      this.panels.forEach(function (panel) {
        var isActive = panel.getAttribute('data-panel-key') === targetKey;
        panel.classList.toggle('hidden', !isActive);
        self.setPanelFocusable(panel, false);
        if (isActive) {
          requestAnimationFrame(function () {
            self.updateScrollbar(panel);
          });
        }
      });
    }
  }

  if (!customElements.get('best-seller-tabs')) {
    customElements.define('best-seller-tabs', BestSellerTabs);
}
})();
