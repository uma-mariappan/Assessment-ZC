import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class OrderStatus extends HTMLElement {
    connectedCallback() {
      this.overlay = this.querySelector('[page-loader]');
      this.attachOrderCancelForm();
      // Using regex to get sales order id in param
      const match = window.location.pathname.match(/\/account\/orders\/(\d+)\/status/);
      this.orderId = match ? match[1] : null;
    }

    async attachOrderCancelForm() {
      this.orderCancelForm = this.querySelector('#orderCancelForm');
      if (!this.orderCancelForm) return;
      
      this.orderLineItems = this.orderCancelForm.querySelectorAll("[data-order-fields]");
      this.orderCancelForm.removeEventListener("submit", this.orderCancelFormHandler);
      this.orderCancelForm.addEventListener("submit", this.orderCancelFormHandler);

      this.handleReasonChange();
    }
    
    async getOrderStatus(orderId) {
      try {
        this.setLoading();
        const response = await zcAdapter.fetch(`/account/orders/${orderId}/status`, { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const htmlContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        const updatedOrderStatus = doc.querySelector('#orderStatusSection');
        if (updatedOrderStatus) {
          const currentOrderStatus = this.querySelector('#orderStatusSection');
          if (currentOrderStatus) {
            currentOrderStatus.innerHTML = updatedOrderStatus.innerHTML;
            this.attachOrderCancelForm();
          }
        } 
      } catch(error) {
        console.error(error);
      } finally {
        this.removeLoading();
      }
    }

    handleReasonChange() {
      this.orderLineItems.forEach(lineItem => {
        const select = lineItem.querySelector("[data-cancel-options]");
        const otherReason = lineItem.querySelector(".otherReason");
    
        if (select) {
          select.addEventListener("change", () => {
            if (select.value === "Other") {
              otherReason.classList.remove("hidden");
            } else {
              otherReason.classList.add("hidden");
              const textarea = otherReason.querySelector("textarea");
              if (textarea) textarea.value = "";
            }
          });
        }
      });
    }

    orderCancelFormHandler = async (event) => {
      event.preventDefault();
      event.stopPropagation();
    
      let hasErrors = false;
      let hasChanges = false;
    
      for (const orderLineItem of this.orderLineItems) {
        const result = this.validateLineItems(orderLineItem);
    
        if (!result) continue; // no changes, skip
        hasChanges = true;

        if (!result.isValid) {
          hasErrors = true;
          continue;
        }
    
        const payload = {
          line_items: [result.data],
          reason: result.reason,
          salesorder_id: result.salesorder_id
        };
    
        await this.orderReturn(payload);
      }

      if (!hasChanges) {
        this.showMessageNotification("Enter the quantity for the products you wish to cancel.", false);
      }  
      if (hasChanges && !hasErrors) {
        this.getOrderStatus(this.orderId);
      }
    };

    validateLineItems(orderLineItem) {
      const qtyInput = orderLineItem.querySelector('input[type="number"]');
      const reasonSelect = orderLineItem.querySelector('[data-cancel-options]');
      const otherReason = orderLineItem.querySelector('.otherReason textarea');
    
      const quantityErrorField = orderLineItem.querySelector('.quantity-error');
      const selectReasonErrorField = orderLineItem.querySelector('.select-reason-error');
      const selectOtherReasonErrorField = orderLineItem.querySelector('.select-other-reason-error');
    
      const itemId = orderLineItem.querySelector('[data-item-id]').value;
      const salesorderItemId = orderLineItem.querySelector('[data-salesorder-item-id]').value;
      const salesorderId = orderLineItem.querySelector('[data-salesorder-id]').value;
    
      const qtyVal = qtyInput.value.trim();
      const reasonVal = reasonSelect.value;
      const otherReasonVal = otherReason ? otherReason.value.trim() : "";
    
      // Reset errors
      [quantityErrorField, selectReasonErrorField, selectOtherReasonErrorField].forEach(el => {
        if (el) el.classList.add("hidden");
      });
    
      // If nothing changed → return null
      if (!qtyVal && !reasonVal) {
        return null;
      }
    
      let isValid = true;
    
      // Validate quantity
      const quantity = parseInt(qtyVal, 10);
      const maxQty = parseInt(qtyInput.getAttribute("data-max-qty"), 10);
    
      
      if (!quantity || quantity <= 0) {
        quantityErrorField.textContent = "Please add Quantity";
        quantityErrorField.classList.remove("hidden");
        isValid = false;
      } else if (quantity > maxQty) {
        quantityErrorField.textContent = "Quantity is more than available.";
        quantityErrorField.classList.remove("hidden");
        isValid = false;
      }
    
      // Validate reason
      if (!reasonVal || reasonVal === "Choose") {
        selectReasonErrorField.classList.remove("hidden");
        isValid = false;
      }
    
      // Validate "Other"
      if (reasonVal === "Other" && !otherReasonVal) {
        selectOtherReasonErrorField.classList.remove("hidden");
        isValid = false;
      }
    
      if (!isValid) {
        return { isValid: false };
      }
    
      return {
        isValid: true,
        data: {
          item_id: itemId,
          salesorder_item_id: salesorderItemId,
          quantity
        },
        reason: reasonVal === "Other" ? otherReasonVal : reasonVal,
        salesorder_id: salesorderId
      };
    }

    async orderReturn(payload) {
      try {
        this.setLoading();
        const response = await zcAdapter.fetch('/portal/orders/returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(response.statusText);

        const json = await response.json();
        this.showMessageNotification(json.message, true);
        const orderId = payload?.salesorder_id;
        if (orderId) {
          window.location.assign(`/account/orders/${orderId}`);
        }
      } catch (err) {
        this.showMessageNotification('Something went wrong. Please try again.', false);
        console.error(err);
      } finally {
        this.removeLoading();
      }
    }

    showMessageNotification(msg, status) {
      const messageElement = this.querySelector('#messageNotification');
      const colorCode = messageElement.querySelector('.color-code');
      colorCode.classList.remove('bg-[#15803d]', 'bg-[#f35958]');
      colorCode.classList.add(status ? 'bg-[#15803d]' : 'bg-[#f35958]');  
      
      const messageText = messageElement.querySelector('#message');  
      messageText.textContent = msg;
    
      messageElement.classList.add('show');  // slide in
      messageElement.classList.remove('opacity-0');
    
      setTimeout(() => {
        messageElement.classList.remove('show'); // slide out
      }, 3000);
    }

    setLoading() {
      this.overlay.classList.remove('hidden');
    }

    removeLoading() {
      this.overlay.classList.add('hidden');
    }

  }

  if (!customElements.get('order-status')) {
    customElements.define('order-status', OrderStatus);
  }
})();
