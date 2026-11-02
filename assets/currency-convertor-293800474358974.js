import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  const STOREFRONT_CURRENCY_COOKIE = 'storefront_currency';
  const STOREFRONT_CURRENCY_MAX_AGE_SEC = 60 * 60 * 24 * 365;

  function getCookieBaseAttributes() {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    return `Path=/; SameSite=Lax${secure}`;
  }

  function getStorefrontCurrencyIdFromCookie() {
    const prefix = `${STOREFRONT_CURRENCY_COOKIE}=`;
    let value = null;
    for (const part of document.cookie.split('; ')) {
      if (!part.startsWith(prefix)) continue;
      const raw = part.slice(prefix.length);
      if (raw === '') continue;
      try {
        value = decodeURIComponent(raw);
      } catch {
        value = raw;
      }
    }
    return value;
  }

  function clearStorefrontCurrencyCookieAllPaths() {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    const commonPaths = ['/', '/products', '/collections', '/cart', '/checkout'];
    const currentPath = window.location.pathname;

    const pathsToClean = new Set(commonPaths);
    pathsToClean.add(currentPath);

    const segments = currentPath.split('/').filter(Boolean);
    let accumulated = '';
    for (const seg of segments) {
      accumulated += '/' + seg;
      pathsToClean.add(accumulated);
    }

    for (const p of pathsToClean) {
      document.cookie = `${STOREFRONT_CURRENCY_COOKIE}=; Path=${p}; SameSite=Lax${secure}; Max-Age=0`;
    }
  }

  function setStorefrontCurrencyCookie(currencyId) {
    const base = getCookieBaseAttributes();
    clearStorefrontCurrencyCookieAllPaths();
    document.cookie = `${STOREFRONT_CURRENCY_COOKIE}=${encodeURIComponent(String(currencyId))}; ${base}; Max-Age=${STOREFRONT_CURRENCY_MAX_AGE_SEC}`;
  }

  class CurrencyConverter extends HTMLElement {
    connectedCallback() {
      // Main-view elements
      this.mainView = this.querySelector('[data-main-view]');
      this.currencyView = this.querySelector('[data-currency-view]');
      this.openCurrencyViewBtn = this.querySelector('[data-open-currency-view]');
      this.backBtn = this.querySelector('[data-currency-back]');
      this.currencyLabel = this.querySelector('[data-currency-label]');
      this.listEl = this.querySelector('[data-currency-list]');
      this.applyBtn = this.querySelector('[data-currency-apply]');

      // Legacy fallback — keeps compatibility with any consumer expecting a native select
      this.select = this.querySelector('[data-currency-trigger]');

      this.currencies = [];
      this.currencyMap = {};
      this.activeCurrencyCode = null;
      this.selectedCurrencyCode = null;
      this.isLoaded = false;

      this.bindUi();
      this.fetchCurrencies();
    }

    bindUi() {
      if (this.openCurrencyViewBtn) {
        this.openCurrencyViewBtn.addEventListener('click', () => this.showCurrencyView());
      }
      if (this.backBtn) {
        this.backBtn.addEventListener('click', () => this.showMainView());
      }
      if (this.applyBtn) {
        this.applyBtn.addEventListener('click', () => this.applySelection());
        this.applyBtn.disabled = true;
      }
    }

    showCurrencyView() {
      if (!this.currencyView) return;
      this.currencyView.classList.remove('hidden', 'slide-out-right');
      this.currencyView.classList.add('flex', 'slide-in-right');
    }

    showMainView(immediate = false) {
      if (!this.currencyView) return;
      // Reset any pending selection so the next open starts from the active currency
      this.selectedCurrencyCode = this.activeCurrencyCode;
      this.highlightSelection();
      this.updateApplyState();

      if (immediate) {
        this.currencyView.classList.add('hidden');
        this.currencyView.classList.remove('flex', 'slide-in-right', 'slide-out-right');
        return;
      }
      if (this.currencyView.classList.contains('hidden')) return;
      this.currencyView.classList.remove('slide-in-right');
      this.currencyView.classList.add('slide-out-right');
      setTimeout(() => {
        this.currencyView.classList.add('hidden');
        this.currencyView.classList.remove('flex', 'slide-out-right');
      }, 300);
    }

    async fetchCurrencies() {
      try {
        const response = await zcAdapter.getCurrencies();
        const json = await response.json();
        const currencies = Array.isArray(json) ? json : json.currencies;

        if (!Array.isArray(currencies) || currencies.length === 0) {
          this.renderEmpty('No currencies available');
          console.error('Currency fetch returned no currencies');
          return;
        }

        this.currencies = currencies;

        let activeCurrencyId = getStorefrontCurrencyIdFromCookie();
        const base = currencies.find((c) => c.is_base_currency) || currencies[0];
        const active = currencies.find((c) => String(c.currency_id) === String(activeCurrencyId)) || base;

        this.activeCurrencyCode = active.currency_code;
        this.selectedCurrencyCode = active.currency_code;

        this.currencyMap = {};
        currencies.forEach((c) => { this.currencyMap[c.currency_code] = c.currency_id; });

        if (!activeCurrencyId) {
          setStorefrontCurrencyCookie(active.currency_id);
        }

        this.isLoaded = true;
        this.renderList();
        this.updateLabel(active);
        this.syncHiddenSelect(active.currency_code);
        this.updateApplyState();
      } catch (error) {
        console.error('Currency fetch failed:', error);
        this.renderEmpty('Unable to load currencies');
      }
    }

    renderEmpty(message) {
      if (!this.listEl) return;
      this.listEl.innerHTML = `<li class="px-5 py-4 text-sm" style="color: var(--color-heading);">${message}</li>`;
    }

    renderList() {
      if (!this.listEl) return;
      this.listEl.innerHTML = '';

      this.currencies.forEach((c) => {
        const li = document.createElement('li');
        li.className = 'border-b';
        li.style.borderColor = 'var(--color-border)';

        const isSelected = c.currency_code === this.selectedCurrencyCode;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.currencyItem = '';
        btn.dataset.code = c.currency_code;
        btn.dataset.id = String(c.currency_id);
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String(isSelected));
        btn.className = `flex w-full items-center justify-between px-5 py-4 text-left text-sm hover:bg-gray-50 ${isSelected ? 'bg-gray-100 font-semibold' : ''}`;
        btn.style.color = 'var(--color-heading)';

        const label = document.createElement('span');
        label.textContent = `${c.currency_code}${c.currency_symbol ? ' ' + c.currency_symbol : ''}`;

        const check = document.createElement('span');
        check.dataset.check = '';
        check.setAttribute('aria-hidden', 'true');
        check.className = c.currency_code === this.selectedCurrencyCode ? '' : 'hidden';
        check.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        btn.appendChild(label);
        btn.appendChild(check);

        btn.addEventListener('click', () => {
          this.selectedCurrencyCode = c.currency_code;
          this.highlightSelection();
          this.updateApplyState();
        });

        li.appendChild(btn);
        this.listEl.appendChild(li);
      });
    }

    highlightSelection() {
      if (!this.listEl) return;
      this.listEl.querySelectorAll('[data-currency-item]').forEach((btn) => {
        const isSelected = btn.dataset.code === this.selectedCurrencyCode;
        btn.setAttribute('aria-checked', String(isSelected));
        btn.classList.toggle('bg-gray-100', isSelected);
        btn.classList.toggle('font-semibold', isSelected);
        const check = btn.querySelector('[data-check]');
        if (check) check.classList.toggle('hidden', !isSelected);
      });
    }

    updateApplyState() {
      if (!this.applyBtn) return;
      const hasChanged = this.isLoaded && this.selectedCurrencyCode && this.selectedCurrencyCode !== this.activeCurrencyCode;
      this.applyBtn.disabled = !hasChanged;
    }

    updateLabel(currency) {
      if (!this.currencyLabel || !currency) return;
      const symbol = currency.currency_symbol ? ` ${currency.currency_symbol}` : '';
      this.currencyLabel.textContent = `${currency.currency_code}${symbol}`;
    }

    syncHiddenSelect(activeCode) {
      if (!this.select) return;
      this.select.innerHTML = '';
      this.currencies.forEach((c) => {
        const option = document.createElement('option');
        option.value = c.currency_code;
        option.textContent = `${c.currency_symbol} ${c.currency_code}`;
        option.selected = c.currency_code === activeCode;
        this.select.appendChild(option);
      });
    }

    async applySelection() {
      if (!this.selectedCurrencyCode || this.selectedCurrencyCode === this.activeCurrencyCode) return;

      const currencyCode = this.selectedCurrencyCode;
      const currencyId = this.currencyMap?.[currencyCode];
      if (currencyId == null || currencyId === '') {
        console.error('Missing currency id for code:', currencyCode);
        return;
      }

      this.applyBtn.disabled = true;

      try {
        const response = await zcAdapter.updateCurrency(currencyCode);

        if (!response.ok) {
          console.error('Failed to set currency: HTTP', response.status);
          this.applyBtn.disabled = false;
          return;
        }

        const json = await response.json();
        if (json.code !== 0) {
          console.error('Failed to set currency:', json.message || 'Unknown error');
          this.applyBtn.disabled = false;
          return;
        }

        setStorefrontCurrencyCookie(currencyId);
        this.activeCurrencyCode = currencyCode;
        window.location.reload();
      } catch (error) {
        console.error('Currency switch failed:', error);
        this.applyBtn.disabled = false;
      }
    }
  }

  if (!customElements.get('currency-converter')) {
    customElements.define('currency-converter', CurrencyConverter);
  }
})();
