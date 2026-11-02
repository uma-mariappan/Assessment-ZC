import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class AccountProfile extends HTMLElement {
    connectedCallback() {
      this.overlay = this.querySelector('[page-loader]');
      this.getProfileDetails();

      this.cancelEditProfileBtn = this.querySelector('#cancelEditProfileBtn');
      this.createdProfile = this.querySelector('#createdProfile');
      this.editProfile = this.querySelector('#editProfile');
      this.formProfileEdit = this.querySelector('#formProfileEdit');
      this.formChangePassword = this.querySelector('#formChangePassword');

      this.formProfileEdit.addEventListener('submit', this.editProfilehandler);
      this.formProfileEdit.querySelector("[name='first_name']")
          .addEventListener('input', this.toCheckRequiredProfileFields);
      this.formProfileEdit.querySelector("[name='last_name']")
          .addEventListener('input', this.toCheckRequiredProfileFields);
      this.formProfileEdit.querySelector("[name='phone']")
          .addEventListener('input', this.toCheckRequiredProfileFields);

      this.cancelEditProfileBtn.addEventListener('click', this.cancelEditProfileHandler);

      this.formChangePassword.addEventListener('submit', this.changePasswordHandler);
      this.querySelector("[name='old_password']").addEventListener('input', () => this.hidePasswordError('oldPasswordFieldError'));
      this.querySelector("[name='new_password']").addEventListener('input', () => this.hidePasswordError('newPasswordFieldError'));
      this.querySelector("[name='confirm_password']").addEventListener('input', () => this.hidePasswordError('confirmPasswordFieldError'));

      this.formChangePassword.addEventListener('reset', () => {
        this.hidePasswordError('oldPasswordFieldError');
        this.hidePasswordError('newPasswordFieldError');
        this.hidePasswordError('confirmPasswordFieldError');
      });

      this.initProfileValues();
    }

    cancelEditProfileHandler = () => {
      this.createdProfile.classList.remove('hidden');
      this.editProfile.classList.add('hidden');
    };

      toCheckOldPasswordFields = (event) => {
        const errorField = this.querySelector('#oldPasswordFieldError');
          if (event.target.value.length == 0 ) {
            errorField.querySelector('[data-error-msg]').textContent = "This field is required";
            errorField.classList.remove('hidden');
          } else {
            if (!errorField.classList.contains('hidden')) errorField.classList.add('hidden');
          }
      }

      toCheckNewPasswordFields = (errorFieldId) => {
        return (event) => {
          const errorField = this.querySelector(`#${errorFieldId}`);
          if (event.target.value.length < 8) {
            errorField.querySelector('[data-error-msg]').textContent = "Your password should have a minimum of 8 characters.";
            errorField.classList.remove('hidden');
          } else {
            if (!errorField.classList.contains('hidden')) errorField.classList.add('hidden');
          }
        };
      };

      toCheckRequiredProfileFields = (event) => {
        const inputElement = event.target;
        const inputValue = inputElement.value;
        const inputId = inputElement.id.concat('Error');

        const getErrorElement = this.formProfileEdit.querySelector(`#${inputId}`);
        const addErrorMsg = getErrorElement.querySelector('[data-error-msg]');

        if (!inputValue || inputValue.length == 0) {
          getErrorElement.classList.remove('hidden');
          addErrorMsg.textContent = "This field is required";
        } else {
          getErrorElement.classList.add('hidden');
          addErrorMsg.textContent = "";
        }
      }

      async initProfileValues() {
        this.setLoading();
        this.profileOldValues = await this.getProfileValues();
        this.removeLoading();
      }

      async getProfileDetails() {
        try {
          this.setLoading();
          const response = await zcAdapter.fetch('/account/profile', { method: 'GET' });
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const htmlContent = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
    
          const updatedProfile = doc.querySelector('#profileInfo');
          if (updatedProfile) {
            const currentProfileInfo = this.querySelector('#profileInfo');
            if (currentProfileInfo) {
              currentProfileInfo.innerHTML = updatedProfile.innerHTML;
          
              this.editBtn = this.querySelector('#editBtn');
              this.editBtn.addEventListener('click', () => {
                this.createdProfile.classList.add('hidden');
                this.editProfile.classList.remove('hidden');
              });
          
              this.createdProfile.classList.remove('hidden');
              this.editProfile.classList.add('hidden');
            }
          }
        } catch(error) {
          console.error(error);
        } finally {
          this.removeLoading();
        }
      }

      async getProfileValues()  {
        const formData = new FormData(this.formProfileEdit);
        const checkbox = this.formProfileEdit.querySelector('[name="receive_promotional_emails"]');

        return {
          user_info: {
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            email: formData.get("email"),
            gender: formData.get("gender"),
            date_of_birth: formData.get("dob"),
            receive_promotional_emails: checkbox && checkbox.checked ? "1" : "0" 
          },
          address_info: {
            address: formData.get("address"),
            city: formData.get("city"),
            state: formData.get("state"),
            country: formData.get("country"),
            postal_code: formData.get("postal_code"),
            phone: formData.get("phone"),
            company_name: formData.get("company"),
            job_title: formData.get("job_title")
          }
        };
      };

      getEditedProfileData = (formData) => {
        const payload = { user_info: {}, address_info: {} };
        const checkbox = this.formProfileEdit.querySelector('[name="receive_promotional_emails"]');

        const newValues = {
          user_info: {
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            email: formData.get("email"),
            gender: formData.get("gender"),
            date_of_birth: formData.get("dob"),
            receive_promotional_emails: checkbox && checkbox.checked ? "1" : "0"
          },
          address_info: {
            address: formData.get("address"),
            city: formData.get("city"),
            state: formData.get("state"),
            country: formData.get("country"),
            postal_code: formData.get("postal_code"),
            phone: formData.get("phone"),
            company_name: formData.get("company"),
            job_title: formData.get("job_title")
          }
        };
      
        Object.keys(newValues.user_info).forEach((key) => {
          if (newValues.user_info[key] !== this.profileOldValues.user_info[key]) {
            payload.user_info[key] = newValues.user_info[key];
          }
        });
      
        Object.keys(newValues.address_info).forEach((key) => {
          if (newValues.address_info[key] !== this.profileOldValues.address_info[key]) {
            payload.address_info[key] = newValues.address_info[key];
          }
        });
      
        if (Object.keys(payload.user_info).length === 0) {
          delete payload.user_info;
        }
        if (Object.keys(payload.address_info).length === 0) {
          delete payload.address_info;
        }
      
        return Object.keys(payload).length > 0 ? payload : null;
      };    

      editProfilehandler = async (event) => {
        event.preventDefault();
        event.stopPropagation();
      
        try {
          this.setLoading();
      
          const formData = new FormData(this.formProfileEdit);
          const payload = this.getEditedProfileData(formData);

          const requiredFields = ["first_name", "last_name", "phone"];
          let hasError = false;

          requiredFields.forEach((name) => {
            const field = this.formProfileEdit.querySelector(`[name="${name}"]`);
            this.toCheckRequiredProfileFields({ target: field });
            if (!field.value.trim()) {
              hasError = true;
            }
          });
          if (hasError) {
            this.removeLoading();
            return;
          }

      
          if (!payload) {
            this.editProfile.classList.add('hidden');
            this.createdProfile.classList.remove('hidden');
            this.showMessageNotification("No changes detected.", false);
            return;
          }

          if (payload?.user_info?.first_name === "" || payload?.user_info?.last_name === "" || payload?.address_info?.phone === "") {
            return;
          }
          const response = await zcAdapter.fetch('/portal/user/profile', {
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      
          if (!response.ok) throw new Error(response.statusText);
      
          const json = await response.json();
          
          this.profileOldValues = await this.getProfileValues();
          await this.getProfileDetails();
      
          this.editProfile.classList.add('hidden');
          this.createdProfile.classList.remove('hidden');
      
          this.showMessageNotification(json.message, json.status);
        } catch (err) {
          console.error("Form submission failed", err);
        } finally {
          this.removeLoading();
        }
      };    

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

      hidePasswordError = (errorFieldId) => {
        const errorField = this.querySelector(`#${errorFieldId}`);
        if (!errorField) return;
        errorField.classList.add('hidden');
        errorField.querySelector('[data-error-msg]').textContent = "";
      };

      changePasswordHandler = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const formData = new FormData(this.formChangePassword);

        const currentPassword = formData.get("old_password")?.trim();
        const newPassword = formData.get("new_password")?.trim();
        const confirmPassword = formData.get("confirm_password")?.trim();

        let hasError = false;

        if (!currentPassword) {
          const err = this.querySelector('#oldPasswordFieldError');
          err.querySelector('[data-error-msg]').textContent = "This field is required";
          err.classList.remove('hidden');
          hasError = true;
        }

        if (!newPassword || newPassword.length < 8) {
          const err = this.querySelector('#newPasswordFieldError');
          err.querySelector('[data-error-msg]').textContent =
            "Your password should have a minimum of 8 characters.";
          err.classList.remove('hidden');
          hasError = true;
        }

        if (!confirmPassword || confirmPassword.length < 8) {
          const err = this.querySelector('#confirmPasswordFieldError');
          err.querySelector('[data-error-msg]').textContent = "Your password should have a minimum of 8 characters.";
          err.classList.remove('hidden');
          hasError = true;
        }

        if (hasError) return;

        await this.updatePassword(currentPassword, newPassword, confirmPassword);
      };

      async updatePassword(currentPassword, newPassword, confirmPassword) {
        try {
          this.setLoading();
          if (!/[A-Z]/.test(newPassword)) {
            this.showMessageNotification("Password must contain at least one uppercase letter.", false);
            return;
          }
          if (!/[a-z]/.test(newPassword)) {
            this.showMessageNotification("Password must contain at least one lowercase letter.", false);
            return;
          }
          if (!/[0-9]/.test(newPassword)) {
            this.showMessageNotification("Password must contain at least one number.", false);
            return;
          }
          if (!/[!@#$%^&*(),.?\":{}|<>]/.test(newPassword)) {
            this.showMessageNotification("Password must contain at least one special character.", false);
            return;
          }
          if (currentPassword == newPassword) {
            this.showMessageNotification("New password should not be same as the old password.", false);
            return;
          }
          if (confirmPassword !== newPassword) {
            this.showMessageNotification("New password and confirm password do not match.", false);
            return;
          }

          const passwordObj = {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
          };
          const response = await zcAdapter.fetch('/changepassword', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(passwordObj),
          });
      
          const json = await response.json();
          if (!response.ok) {
            this.showMessageNotification(json.message, json.status);
            return;
          }
          this.showMessageNotification(json.message, json.status);

          this.formChangePassword.reset();
          this.hidePasswordError('oldPasswordFieldError');
          this.hidePasswordError('newPasswordFieldError');
          this.hidePasswordError('confirmPasswordFieldError');

        } catch(error) {
          console.error("Form submission failed", error);
          this.showMessageNotification("Something went wrong, please try again.", false);
        } finally {
          this.removeLoading();
        }
      }

      setLoading() {
        this.overlay.classList.remove('hidden');
      }
    
      removeLoading() {
        this.overlay.classList.add('hidden');
      }

      disconnectedCallback() {
        this.formProfileEdit?.removeEventListener('submit', this.editProfilehandler);
        this.formProfileEdit?.querySelector("[name='first_name']")?.removeEventListener('input', this.toCheckRequiredProfileFields);
        this.formProfileEdit?.querySelector("[name='last_name']")?.removeEventListener('input', this.toCheckRequiredProfileFields);
        this.formProfileEdit?.querySelector("[name='phone']")?.removeEventListener('input', this.toCheckRequiredProfileFields);
    
        this.cancelEditProfileBtn?.removeEventListener('click', this.cancelEditProfileHandler);
    
        this.formChangePassword?.removeEventListener('submit', this.changePasswordHandler);
        this.querySelector("[name='old_password']")?.removeEventListener('input', this.toCheckOldPasswordFields);
        this.querySelector("[name='new_password']")?.removeEventListener('input', this.toCheckNewPasswordFields);
        this.querySelector("[name='confirm_password']")?.removeEventListener('input', this.toCheckNewPasswordFields);
      }
    }
    
  if (!customElements.get('account-profile')) {
    
    customElements.define('account-profile', AccountProfile);
    
  }
})();
