(() => {
  function hasValue(value) {
    if (value == null || value === false) return false;
    if (Array.isArray(value)) return value.some((item) => String(item).trim() !== '');
    return String(value).trim() !== '';
  }

  function hideEmptyDisplayFields(element) {
    const config = element.config;
    if (!config || !Array.isArray(config.variants)) return;

    let hasDisplayableField = false;

    config.variants.forEach((variant) => {
      const variantId = String(variant.id ?? variant.variant_id);
      const variantContainer = [...element.querySelectorAll('[data-variant-custom-fields]')]
        .find((container) => container.getAttribute('data-variant-custom-fields') === variantId);

      (variant.custom_fields || []).forEach((field) => {
        if (!field.show_in_store && !field.edit_on_store) return;

        if (hasValue(field.value)) {
          hasDisplayableField = true;
          return;
        }

        if (!variantContainer) return;

        variantContainer.querySelectorAll('[data-zs-custom-field-display-id]').forEach((display) => {
          if (display.getAttribute('data-zs-custom-field-display-id') === String(field.customfield_id)) {
            display.remove();
          }
        });
        variantContainer.querySelectorAll('[data-custom-field-id]').forEach((input) => {
          if (input.getAttribute('data-custom-field-id') === String(field.customfield_id)) {
            input.closest('[data-zs-customfield-container]')?.remove();
          }
        });
      });
    });

    if (hasDisplayableField) return;

    const tabs = element.closest('product-details-tabs');
    const button = tabs?.querySelector('[data-product-tab-btn][data-tab-target="custom-fields"]');
    const content = tabs?.querySelector('[data-product-tab-content="custom-fields"]');
    if (button) button.hidden = true;
    if (content) content.hidden = true;
  }

  customElements.whenDefined('custom-fields').then(() => {
    document.querySelectorAll('custom-fields').forEach(hideEmptyDisplayFields);
  });
})();
