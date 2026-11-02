(function () {
  window.addToCart = addToCart;
  window.quickViewProduct = quickViewProduct;
  window.removeFromCart = removeFromCart;
  window.updateCartQuantity = updateCartQuantity;
  window.postCheckoutAddress = postCheckoutAddress;
  window.postShippingMethod = postShippingMethod;
  window.postPaymentMethod = postPaymentMethod;
})();

async function addToCart(variantId, orgId, sectionName, quantity, productId = null) { // returns a json containing the rendered ${sectionName} section
  const formData = new FormData();
  formData.append('variant_id', variantId);
  formData.append('orgId', orgId);
  formData.append('sections', sectionName);
  formData.append('quantity', quantity);
  try {
  const response = await fetch('/addtocart', {
    method: 'POST',
    body: formData
  });
  const json = await response.json();
  if (response.ok && productId) {
    window.pushAddToCartEventToAnalytics(variantId, quantity, productId);
  }
  return json;
  } catch (error) {
    throw new Error(error);
  }
}

async function quickViewProduct(productId, sectionName, listId = 'home-page', listTitle = 'Home Page') { // returns a json containing the rendered ${sectionName} section
  try {
    const url = `/products/${productId}/quickview?${new URLSearchParams({ sections: sectionName })}`;
    const response = await fetch(url);
    const json = await response.json();
    if (response.ok && productId && listId) {
      let list_data = {
        id: listId,
        title: listTitle
      };
      window.pushSelectListItemToAnalytics(productId, list_data);
      window.pushViewProductDetailsToAnalytics(productId);
    }
    return json;
  } catch (error) {
    throw new Error(error);
  }
}

async function removeFromCart(variantId, sectionName, productId = null) { // returns a json containing the rendered ${sectionName} section
  try {
    let url = '/cart/change' + '?' + new URLSearchParams({
      variant_id: variantId,
      sections: sectionName
    });
    const response = await fetch(url, { method: 'DELETE' });
    const json = await response.json();
    if (response.ok && productId) {
      window.pushRemoveFromCartToAnalytics(variantId, 1, productId);
    }
    return json;
  } catch (error) {
    throw new Error(error);
  }
}

async function updateCartQuantity(variantId, quantity, sectionName, productId = null) { // returns a json containing the rendered ${sectionName} section
  let formData = new FormData();
  formData.append('variant_id', variantId);
  formData.append('quantity', quantity);
  formData.append('sections', sectionName);
  const response = await fetch('/cart/change', {
      method: 'PUT',
      body: formData
  });
  const json = await response.json();
  if (response.ok && productId) {
    if (quantity > 0) {
      window.pushAddToCartEventToAnalytics(variantId, quantity, productId);
    } else {
      window.pushRemoveFromCartToAnalytics(variantId, quantity * -1, productId);
    }
  }
  return json;
}

async function postCheckoutAddress(body) { // body contains either shipping and billing address or their ids if previously stored address is selected along with is_consent_agreed based on user input
  try {
    const response = await fetch('checkout/address', {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      return {
        code: -1,
        message: response.statusText
      }
    }
    const contentType = response.headers.get('Content-Type');
    const htmlContent = await response.text();
    if (contentType && contentType.includes('text/html')) {
      return {
        code: 0,
        htmlContent
      };
    }
    const jsonContent = JSON.parse(htmlContent);
    return {
      code: 0,
      message: jsonContent.message
    }
  } catch (error) {
    throw new Error(error);
  }
}

async function postShippingMethod(jsonValue) { // jsonValue contains entire form of the shipping method page in checkout as key value pair
  try {
    const response = await fetch('checkout/shippingmethods', {
      method: 'PUT',
      body: JSON.stringify(jsonValue)
    });
    if (!response.ok) {
      return {
        code: -1,
        message: response.statusText
      }
    }
    const contentType = response.headers.get('Content-Type');
    const htmlContent = await response.text();
    if (contentType && contentType.includes('text/html')) {
      window.pushShippingInfoToAnalyics();
      return {
        code: 0,
        htmlContent
      };
    }
    const jsonContent = JSON.parse(htmlContent);
    return {
      code: 0,
      message: jsonContent.message
    }
  } catch (error) {
    throw new Error(error);
  }
}

async function postPaymentMethod(formDataObject = null) { // formDataObject contains entire form of the payment method page in checkout as key value pair for offline payment mode
  try {
    const response = await fetch('checkout/offlinepayment', {
        method: 'POST',
        body: JSON.stringify(formDataObject)
    });
    let json = await response.json();
    return json;
  } catch (error) {
    throw new Error(error);
  }
}
