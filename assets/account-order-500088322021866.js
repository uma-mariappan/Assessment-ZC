import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class AccountOrder extends HTMLElement {
    connectedCallback() {
      this.overlay = this.querySelector('[page-loader]');
      this.onGoingOrders = this.querySelector('#onGoingOrders');
      this.pastOrders = this.querySelector('#pastOrders');
      this.sectionOngoing = this.querySelector('#sectionOngoingOrder');
      this.sectionPast = this.querySelector('#sectionPastOrder');

      this.onGoingOrders.addEventListener('click', this.methodOnGoingOrder);
      this.pastOrders.addEventListener('click', this.methodPastOrder);
      this.orderDateFilter = this.querySelector('#orderDateFilter');
      this.orderDateFilter.addEventListener('change', (e) => this.orderDateFilterHandler(e.target));
      this.addEventListener('click', this.handleClick);
    }

    handleClick = (event) => {
      const buyAgainBtn = event.target.closest('[data-buy-again]');
      if (!buyAgainBtn) return;
      this.handleBuyAgain(buyAgainBtn);
    };

    methodOnGoingOrder = () => {
      this.sectionOngoing.classList.remove('hidden');
      this.sectionPast.classList.add('hidden');

      if (!this.onGoingOrders.classList.contains('border-color')) {
        this.onGoingOrders.classList.add('border-b-2', 'border-color', 'font-semibold');
        this.pastOrders.classList.remove('border-b-2', 'border-color', 'font-semibold');
      }
    };

    methodPastOrder = () => {
      this.sectionOngoing.classList.add('hidden');
      this.sectionPast.classList.remove('hidden');

      if (!this.pastOrders.classList.contains('border-color')) { 
        this.pastOrders.classList.add('border-b-2', 'border-color', 'font-semibold');
        this.onGoingOrders.classList.remove('border-b-2', 'border-color', 'font-semibold');
      }
    };

    orderDateFilterHandler = async (event) => {
      const activeTab = this.sectionPast?.classList.contains('hidden') ? 'ongoing' : 'past';
      const selectedValue = event.value;
      this.setLoading();
      try {
        const response = await zcAdapter.fetch(`/account/orders?filter_date=${event.value}`, { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const htmlContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        const updatedOrder = doc.querySelector('account-order');
        if (updatedOrder) {
          const currentOrder = this;
          if (currentOrder) {
            currentOrder.innerHTML = updatedOrder.innerHTML;
            currentOrder.reinitialize();
            if (this.orderDateFilter) {
              this.orderDateFilter.value = selectedValue;
            }
            if (activeTab === 'past') {
              this.methodPastOrder();
            } else {
              this.methodOnGoingOrder();
            }
          }
        } 
      } catch(error) {
        console.error(error);
      } finally {
        this.removeLoading();
      }
    }

    handleBuyAgain = async (button) => {
      const rawLineItems = button.getAttribute('data-order-line-items');
      if (!rawLineItems) return;

      let lineItems = [];
      try {
        lineItems = JSON.parse(rawLineItems);
      } catch (error) {
        console.error('Invalid order line items payload', error);
        return;
      }

      const variants = lineItems.map((item) => ({
          variant_id: String(item.item_id || '').trim(),
          quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
        })).filter((item) => item.variant_id !== '');

      if (variants.length === 0) return;

      this.setLoading();
      try {

        const response = await zcAdapter.fetch('/bulkaddtocart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ variants })
        });

        if (!response.ok) {
          throw new Error(`Failed to add items to cart: ${response.status}`);
        }

        window.location.href = '/cart';
      } catch (error) {
        console.error(error);
        this.removeLoading();
      }
    }

    setLoading() {
      this.overlay.classList.remove('hidden');
    }

    removeLoading() {
      this.overlay.classList.add('hidden');
    }

    reinitialize() {
      this.overlay = this.querySelector('[page-loader]');
      this.onGoingOrders = this.querySelector('#onGoingOrders');
      this.pastOrders = this.querySelector('#pastOrders');
      this.sectionOngoing = this.querySelector('#sectionOngoingOrder');
      this.sectionPast = this.querySelector('#sectionPastOrder');
      this.orderDateFilter = this.querySelector('#orderDateFilter');

      this.onGoingOrders.addEventListener('click', this.methodOnGoingOrder);
      this.pastOrders.addEventListener('click', this.methodPastOrder);
      this.orderDateFilter.addEventListener('change', (e) => this.orderDateFilterHandler(e.target));
    }
  }

  if (!customElements.get('account-order')) {
    customElements.define('account-order', AccountOrder);
  }
})();
