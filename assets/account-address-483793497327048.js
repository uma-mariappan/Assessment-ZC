import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class AccountAddress extends HTMLElement {
    connectedCallback() {
      this.overlay = this.querySelector('[page-loader]');
      this.createForm = this.querySelector('#createAddressForm');
      this.createForm.addEventListener('submit', this.createAddresshandler);
      
      this.editForm = this.querySelector('#editAddressForm');
      this.editForm.addEventListener('submit', this.editAddresshandler);
      //this.getAddressHandler();

      this.addNewAddressBtn = this.querySelector('#addNewAddressBtn');
      this.cancelAddressBtn = this.querySelector('#cancelAddressBtn');
      this.cancelEditAddressBtn = this.querySelector('#cancelEditAddressBtn');
      this.createdAddress = this.querySelector('#createdAddress');
      this.newAddress = this.querySelector('#newAddress');
      this.editAddress = this.querySelector('#editAddress');

      this.addressCardEditBtnHandler();

      this.addNewAddressBtn.addEventListener('click', () => {
        this.toggleAddButton(false);
        if (!this.createdAddress.classList.contains('hidden')) this.createdAddress.classList.add('hidden');
        if (!this.editAddress.classList.contains('hidden')) this.editAddress.classList.add('hidden');      
        this.newAddress.classList.remove('hidden');
        this.getCountries(this.newAddress);
      });
      this.cancelAddressBtn.addEventListener('click', () => {
          this.newAddress.classList.add('hidden');
          this.createdAddress.classList.remove('hidden');
          this.toggleAddButton(true);
      });

      this.cancelEditAddressBtn.addEventListener('click', () => {
        if (!this.editAddress.classList.contains('hidden')) this.editAddress.classList.add('hidden');
        this.createdAddress.classList.remove('hidden');
        this.toggleAddButton(true);
      });

      this.attachLiveValidation(this.createForm);
      this.attachLiveValidation(this.editForm);
    };

    validateField(field) {
      const errorMsg = field.parentElement.querySelector('.error-msg');
    
      if (field.type === 'checkbox') return true;
    
      // skip state validation if no states exist
      if (field.name === 'state') {
        const form = field.closest('form');
        const country = form.querySelector('select[name="country"]')?.value;
        const selectedCountry = this.countries?.find(c => c.country_name === country);
        if (!selectedCountry || !selectedCountry.states || selectedCountry.states.length === 0) {
          if (errorMsg) errorMsg.classList.add('hidden');
          field.classList.remove('border-red-500');
          return true;
        }
      }
    
      if (field.name === 'phone') {
        const value = field.value.trim();
      
        if (!value) {
          if (errorMsg) {
            errorMsg.textContent = "This field is required";
            errorMsg.classList.remove('hidden');
          }
          field.classList.add('border-red-500');
          return false;
        }
      
        const phoneRegex = /^[0-9]+$/;
        if (!phoneRegex.test(value)) {
          if (errorMsg) {
            errorMsg.textContent = "Invalid phone number format";
            errorMsg.classList.remove('hidden');
          }
          field.classList.add('border-red-500');
          return false;
        }
      }    
    
      if (!field.value.trim()) {
        if (errorMsg) errorMsg.classList.remove('hidden');
        field.classList.add('border-red-500');
        return false;
      } else {
        if (errorMsg) errorMsg.classList.add('hidden');
        field.classList.remove('border-red-500');
        return true;
      }
    }  
    
    validateForm(form) {
      let isValid = true;
      const fields = form.querySelectorAll('input[name], textarea[name], select[name]');
      fields.forEach(field => {
        if (!this.validateField(field)) isValid = false;
      });
      return isValid;
    }

    attachLiveValidation(form) {
      if (!form) return;
      const fields = form.querySelectorAll('input[name], textarea[name], select[name]');
      fields.forEach(field => {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => this.validateField(field));
      });
    }

    toggleAddButton(show) {
      this.addNewAddressBtn.classList.toggle('hidden', !show);
    }


    getAddressHandler = async () => {
      this.setLoading();
      try {
        const response = await zcAdapter.fetch('/account/addresses', { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const htmlContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        const updatedAddress = doc.querySelector('#createdAddress');
        if (updatedAddress) {
          const currentAddress = this.querySelector('#createdAddress');
          if (currentAddress) {
            currentAddress.innerHTML = updatedAddress.innerHTML;
            this.addressCardEditBtnHandler();
          }
        } 
      } catch(error) {
        console.error(error);
      } finally {
        this.removeLoading();
      }
    }

    addressCardEditBtnHandler() {
      this.getCountries(this.editAddress);
      this.editAddressBtn = this.querySelectorAll('.editAddressBtn');
      this.addressDeleteBtn = this.querySelectorAll('.addressDeleteBtn');

      this.editAddressBtn.forEach((editBtn) => {
        editBtn.addEventListener('click', ()=> {
          const addressContainer = editBtn.closest("[data-address-json]");
          const script = addressContainer.querySelector("script[type='application/json']").textContent;
          const records = JSON.parse(script);
        
          const editAddressSection = this.editAddress;
          this.createdAddress.classList.add('hidden');
          editAddressSection.classList.remove('hidden');
          this.toggleAddButton(false);
        
          editAddressSection.querySelector('form').setAttribute('action', `/portal/address/${records.address_id}`);
          editAddressSection.querySelector('form').setAttribute('data-address-id', `${records.address_id}`);
          editAddressSection.querySelector('textarea').textContent = records.address;
          editAddressSection.querySelector('[name="attention"]').value = records.attention;
          editAddressSection.querySelector('[name="first_name"]').value = records.first_name;
          editAddressSection.querySelector('[name="last_name"]').value = records.last_name;
          editAddressSection.querySelector('[name="city"]').value = records.city;
          editAddressSection.querySelector('[name="phone"]').value = records.phone;
          editAddressSection.querySelector('[name="zip"]').value = records.zip_code;
        
          const countrySelect = editAddressSection.querySelector('[name="country"]');
          countrySelect.value = records.country;
          this.populateStates(countrySelect, records.state);
        
          const stateSelect = editAddressSection.querySelector('[name="state"]');
          stateSelect.value = records.state;

          const showDefaultAddressCheckbox = editAddressSection.querySelector('[name="defaultCheckbox"]').closest('div');
          if (records.is_default == 'true' || records.is_default === true) {
            showDefaultAddressCheckbox.classList.add('hidden');
          } else {
            editAddressSection.querySelector('[name="defaultCheckbox"]').checked = false;
            showDefaultAddressCheckbox.classList.remove('hidden');
          }
        
          this.beforeEditedValues = Object.fromEntries(new FormData(this.editForm));
        });      
      });

      this.addressDeleteBtn.forEach(addressDelete => {
        addressDelete.addEventListener('click', ()=> {
          const addressId = addressDelete.closest('[data-address-json]').getAttribute('id');
          this.deleteAddressHandler(addressId);
        });
      });
    }

    createAddresshandler = async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!this.validateForm(this.createForm)) return;

      this.setLoading();

      try {
        const formData = new FormData(this.createForm);

        const addressObj = {
          address: formData.get("address"),
          city: formData.get("city"),
          state: formData.get("state"),
          zip: formData.get("zip"),
          phone: formData.get("phone"),
          attention: `${formData.get("first_name")} ${formData.get("last_name")}`,
          country: formData.get("country")
        };

        const payload = {
          address_details: JSON.stringify(addressObj),
        };

        const response = await zcAdapter.fetch('/portal/address', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(response.statusText);

        const json = await response.json();
        const addressId = json.address.address_info.address_id;

        const existingAddresses =
          this.querySelectorAll('[data-address-json]').length;

        const isFirstAddress = existingAddresses === 0;
        const makeDefault = formData.get("defaultCheckbox") === 'on';

        if (makeDefault || isFirstAddress) {
          await this.updateDefaultAddress(addressId);
        }

        await this.getAddressHandler();

        this.createForm.reset();
        this.showMessageNotification(json.message, true);

      } catch (err) {
        console.error(err);
        this.showMessageNotification("Failed to add new address.", false);
      } finally {
        this.newAddress.classList.add('hidden');
        this.editAddress.classList.add('hidden');
        this.createdAddress.classList.remove('hidden');
        this.toggleAddButton(true);
        this.removeLoading();
      }
    };

    updateDefaultAddress = async (addressId) => {
      const response = await zcAdapter.fetch(`/portal/address/${ addressId }/markasdefault`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      } else {
        const json = await response.json();
        this.showMessageNotification(json.message, true);
        return true;
      }
    };

    editAddresshandler = async (event) => {
      event.preventDefault();
      event.stopPropagation();
    
      if (!this.validateForm(this.editForm)) return;
    
      try {
        this.setLoading();
        const formData = new FormData(this.editForm);
        const currentValues = Object.fromEntries(formData);
        const defaultAddress = formData.get("defaultCheckbox");
        const addressId = this.editForm.getAttribute('data-address-id');
        delete currentValues.defaultCheckbox;
    
        currentValues.attention = `${currentValues.first_name} ${currentValues.last_name}`.trim();
    
        const changedValues = {};
        for (const key in currentValues) {
          if (currentValues[key] !== this.beforeEditedValues[key]) {
            changedValues[key] = currentValues[key];
          }
        }
    
        const defaultAddressChecked = this.editForm.querySelector('input[name="defaultCheckbox"]')?.checked;
    
        if (Object.keys(changedValues).length === 0 && defaultAddressChecked) {
          await this.updateDefaultAddress(addressId);
          return;
        }
    
        if (Object.keys(changedValues).length === 0) {
          this.removeLoading();
          this.showMessageNotification("No changes detected.", false);
          return;
        }
    
        const payload = {
          address_details: JSON.stringify(changedValues),
        };
        const response = await zcAdapter.fetch(this.editForm.action, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
    
        if (!response.ok) throw new Error(response.statusText);
    
        const json = await response.json();
        this.beforeEditedValues = currentValues; 
    
        if (defaultAddressChecked) {
          await this.updateDefaultAddress(addressId);
        }
        this.showMessageNotification(json.message, true);
    
      } catch (err) {
        console.error("Form submission failed", err);
        this.showMessageNotification("Failed to update address.", false);
      } finally {
        await this.getAddressHandler();
        this.newAddress.classList.add('hidden');
        this.editAddress.classList.add('hidden');
        this.createdAddress.classList.remove('hidden');
        this.toggleAddButton(true);
        this.removeLoading();
      }
    };  

    deleteAddressHandler = async (addressId) => {      
        try {
          this.setLoading();
          const response = await zcAdapter.fetch(`/portal/address/${addressId}`, {
            method: "DELETE"
          });
      
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          const json = await response.json();
          if(json.status) {
            this.showMessageNotification(json.message, true);
          }
        } catch (err) {
          console.error("Form submission failed", err);
        } finally {        
          await this.getAddressHandler();  
          this.removeLoading();
        }
    };

    async getCountries(address) {
      try {
        const response = await zcAdapter.fetch('/portal/address/countries', { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
        const data = await response.json();
        this.countries = data.countries;
    
        const countrySelect = address.querySelector('select[name="country"]');

        if (countrySelect) {
          countrySelect.innerHTML = '<option value="">Select country</option>';
          this.countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.country_name;
            option.textContent = country.country_name;
            countrySelect.appendChild(option);
          });

          if (!countrySelect.value) {
            countrySelect.value = "India";
          }
          this.populateStates(countrySelect);

          countrySelect.addEventListener('change', (e) => this.populateStates(e.target));
        }
      } catch (error) {
        console.error("Failed loading countries:", error);
      }
    }

    populateStates(countrySelect, selectedState = null) {
      const wrapper = countrySelect.closest('form');
      const stateSelect = wrapper.querySelector('select[name="state"]');
      stateSelect.innerHTML = '<option value="">Select state</option>';
    
      const selectedCode = countrySelect.value;
      const selectedCountry = this.countries.find(c => c.country_name === selectedCode);
    
      if (selectedCountry && selectedCountry.states && selectedCountry.states.length > 0) {
        stateSelect.disabled = false;
        stateSelect.classList.remove('cursor-not-allowed', 'bg-gray-100', 'opacity-70');
    
        selectedCountry.states.forEach(state => {
          const option = document.createElement('option');
          option.value = state.state_name;
          option.textContent = state.state_name;
          stateSelect.appendChild(option);
        });
    
        if (selectedState) {
          stateSelect.value = selectedState;
        }
      } else {
        stateSelect.disabled = true;
        stateSelect.classList.add('cursor-not-allowed', 'bg-gray-100', 'opacity-70');
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
  if (!customElements.get('account-address')) {
    customElements.define('account-address', AccountAddress);
  }
})();
