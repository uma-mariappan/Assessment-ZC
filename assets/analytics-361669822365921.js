const ISANALYTICS = true;

(function () {
  if (window.location.pathname.includes("/products/")) {
    const productId = window.location.pathname.split("/products/")[1].split("/")[0];
    pushViewProductDetailsToAnalytics(productId);
  } else if (window.location.pathname.includes("/collections/") || window.location.pathname.includes("/categories/") || window.location.pathname.includes("/search")) {
    pushListPageViewToAnalytics();
    pushSearchToAnalytics();
  } else if (window.location.pathname.includes("/cart")) {
    pushViewCartToAnalytics();
  } else if (window.location.pathname.includes("/checkout")) {
    pushCheckOutBeginToAnalytics();
  } else if (window.location.pathname.includes("/paymentstatus")) {
    pushPaymentInfoToAnalyics();
    pushPurchaseInfoToAnalyics();
  }
  window.pushAddToCartEventToAnalytics = pushAddToCartEventToAnalytics;
  window.pushRemoveFromCartToAnalytics = pushRemoveFromCartToAnalytics;
  window.pushSearchToAnalytics = pushSearchToAnalytics;
  window.pushSelectListItemToAnalytics = pushSelectListItemToAnalytics;
  window.pushViewProductDetailsToAnalytics = pushViewProductDetailsToAnalytics;
  window.pushCheckOutBeginToAnalytics = pushCheckOutBeginToAnalytics;
  window.pushShippingInfoToAnalyics = pushShippingInfoToAnalyics;
  window.pushPaymentInfoToAnalyics = pushPaymentInfoToAnalyics;
  window.pushPurchaseInfoToAnalyics = pushPurchaseInfoToAnalyics;
})();

async function pushAddToCartEventToAnalytics(variantId, quantity, productId) {
  let product_data = await getProductData(productId);
  if (isAnalyticsEnabled()) {
    let items = [];
    items.push(getFormattedItemDetails(variantId, quantity, product_data, ISANALYTICS));
    dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        items
      }
    });
  }
  if (isPixelEnabled()) {
    let contents = [];
    let content_ids = [];
    contents.push(getFormattedItemDetails(variantId, quantity, product_data, !ISANALYTICS));
    content_ids.push(contents[0].id);
    fbq("track", "AddToCart", {
      content_name: product_data?.title,
      content_type: "product",
      content_ids,
      contents
    });
  }
}

async function pushListPageViewToAnalytics() {
  let list_page_data = await getListData();
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < list_page_data?.products?.length; i++) {
      let product = list_page_data.products[i];
      items.push(getFormattedItemDetails("", "", product ,ISANALYTICS));
    }
    let isSearchPage = list_page_data?.id === undefined;
    if (isSearchPage) {
      dataLayer.push({
        event: "view_item_list",
        ecommerce: {
          item_list_id: 'search_results',
          item_list_name: 'Search Results',
          items
        }
      });
    } else {
      dataLayer.push({
        event: "view_item_list",
        ecommerce: {
          item_list_id: list_page_data?.id,
          item_list_name: list_page_data?.title ? list_page_data?.title : list_page_data?.name,
          items
        }
      });
    }
  }
  if (isPixelEnabled()) {
    let contents = [];
    let content_ids = [];
    for (let i = 0; i < list_page_data?.products?.length; i++) {
      let product = list_page_data.products[i];
      contents.push(getFormattedItemDetails("", "", product, !ISANALYTICS));
      content_ids.push(product.id);
    }
    fbq("track", "ViewContent", {
      content_name: list_page_data?.title ? list_page_data?.title : list_page_data?.name,
      content_type: "products list",
      content_ids,
      contents
    });
  }
}

async function pushSelectListItemToAnalytics(productId, list_data) {
  let product_data = await getProductData(productId);
  if (!product_data || !list_data) {
    return;
  }
  if (isAnalyticsEnabled()) {
    let items = [];
    items.push(getFormattedItemDetails("", "", product_data, ISANALYTICS));
    dataLayer.push({
      event: "select_item",
      ecommerce: {
        item_list_id: list_data?.id,
        item_list_name: list_data?.title ? list_data?.title : list_data?.name,
        items
      }
    });
  }
}

async function pushViewCartToAnalytics() {
  let cart_list = await getCartData();
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < cart_list?.items?.length; i++) {
      let product = cart_list?.items[i];
      items.push(getFormattedItemDetails("", "", product, ISANALYTICS));
    }
    dataLayer.push({
      event: "view_cart",
      ecommerce: {
        currency: cart_list?.currency?.iso_code,
        value: cart_list?.total_price,
        items
      }
    });
  }
}

async function pushViewProductDetailsToAnalytics(productId) {
  let product_data = await getProductData(productId);
  if (isAnalyticsEnabled()) {
    let items = [];
    items.push(getFormattedItemDetails("", "", product_data, ISANALYTICS));
    dataLayer.push({
      event: "view_item",
      ecommerce: {
        items
      }
    });
  }
  if (isPixelEnabled()) {
    let contents = [];
    let content_ids = [];
    contents.push(getFormattedItemDetails("", "", product_data, !ISANALYTICS));
    content_ids.push(contents[0].id);
    fbq("track", "ViewContent", {
      content_name: product_data?.title,
      content_type: "product",
      content_ids,
      contents
    });
  }
}

async function pushRemoveFromCartToAnalytics(variantId, quantity, productId) {
  let product_data = await getProductData(productId);
  let items = [];
  if (isAnalyticsEnabled()) {
    items.push(getFormattedItemDetails(variantId, quantity, product_data, ISANALYTICS));
    dataLayer.push({
      event: "remove_from_cart",
      ecommerce: {
        items
      }
    });
  }
}

async function pushCheckOutBeginToAnalytics() {
  let cart_list = await getCartData();
  let checkout_data = await getCheckoutData();
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < cart_list?.items?.length; i++) {
      let product = cart_list?.items[i];
      items.push(getFormattedItemDetails("", "", product, ISANALYTICS));
    }
    dataLayer.push({
      event: "begin_checkout",
      ecommerce: {
        currency: checkout_data?.currency_code,
        value: checkout_data?.total,
        coupon: checkout_data?.coupon?.coupon_code || "",
        items
      }
    });
  }
  if (isPixelEnabled()) {
    let contents = [];
    let content_ids = [];
    for (let i = 0; i < cart_list?.items?.length; i++) {
      let product = cart_list?.items[i];
      let item = getFormattedItemDetails("", "", product, ISANALYTICS);
      content.push(item);
      content_ids.push(item.item_id);
    }
    fbq('track', 'InitiateCheckout', {
      content_ids,
      content_type: 'product',
      currency: checkout_data?.currency_code,
      value: checkout_data?.total,
      num_items: contents.length,
      contents
    });
  }
}

async function pushShippingInfoToAnalyics() {
  let checkout_data = await getCheckoutData();
  let cart_list = await getCartData();
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < cart_list?.items?.length; i++) {
      let product = cart_list?.items[i];
      items.push(getFormattedItemDetails("", "", product, ISANALYTICS));
    }
    dataLayer.push({
      event: "add_shipping_info",
      ecommerce: {
        currency: checkout_data?.currency_code,
        value: checkout_data?.total,
        coupon: checkout_data?.coupon?.coupon_code || "",
        shipping_tier: getShippingTierName(checkout_data?.shipping_charge_details, checkout_data?.shipping_charge_id),
        items
      }
    });
  }
}

async function pushPaymentInfoToAnalyics() {
  let payment_status = await getPaymentData();
  let cart_list = await getCartData();
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < cart_list?.items?.length; i++) {
      let product = cart_list?.items[i];
      items.push(getFormattedItemDetails("", "", product, ISANALYTICS));
    }
    dataLayer.push({
      event: "add_payment_info",
      ecommerce: {
        currency: payment_status?.currency_code,
        value: payment_status?.total,
        coupon: payment_status?.coupon_code || "",
        payment_type: payment_status?.payment_mode,
        items
      }
    });
  }
  if (isPixelEnabled()) {
    let contents = [];
    let content_ids = [];
    for (let i = 0; i < cart_list?.items?.length; i++) {
      let product = cart_list?.items[i];
      let item = getFormattedItemDetails("", "", product, ISANALYTICS);
      content.push(item);
      content_ids.push(item.item_id);
    }
    fbq('track', 'AddPaymentInfo', {
      content_ids,
      content_type: 'product',
      currency: payment_status?.currency_code,
      value: payment_status?.total,
      num_items: payment_status?.line_items?.length,
      payment_type: payment_status?.payment_mode,
      contents
    });
  }
}

async function pushPurchaseInfoToAnalyics() {
  let payment_status = await getPaymentData();
  let cart_list = await getCartData();
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < cart_list?.items?.length; i++) {
      let product = cart_list?.items[i];
      items.push(getFormattedItemDetails("", "", product, ISANALYTICS));
    }
    dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: payment_status?.salesorder_id,
        value: payment_status?.total,
        shipping: payment_status?.shipping_details?.shipping_rate_formatted || "",
        currency: payment_status?.currency_code,
        coupon: payment_status?.coupon_code || "",
        items
      }
    });
  }
  if (isPixelEnabled()) {
    let contents = [];
    let content_ids = [];
    for (let i = 0; i < cart_list?.items?.length; i++) {
      let product = cart_list?.items[i];
      let item = getFormattedItemDetails("", "", product, ISANALYTICS);
      content.push(item);
      content_ids.push(item.item_id);
    }
    fbq('track', 'Purchase', {
      content_ids,
      content_type: 'product',
      currency: payment_status?.currency_code,
      value: payment_status?.total,
      num_items: payment_status?.line_items?.length,
      contents,
      order_id: payment_status?.salesorder_id,
    });
  }
}

async function pushSearchToAnalytics() {
  const params = new URLSearchParams(window.location.search);
  const searchTerm = params.get('q');
  if (!searchTerm) {
    return;
  }
  let list_page_data = await getListData();
  if (isAnalyticsEnabled()) {
    dataLayer.push({
      event: "view_search_results",
      search_term: searchTerm,
      results_count: list_page_data?.results_count
    });
  }
  if (isPixelEnabled()) {
    let pixel_payload = {
      search_string: searchTerm,
      num_items: list_page_data?.results_count
    };
    fbq("track", 'Search', pixel_payload);
  }
}

function getFormattedItemDetails(variant_id, quantity, product, isAnalytics) {
		if(!product) {
			return;
		}
		var item = {};
    var item_id =  product.variants?.[0]?.id;
		var variant_name = product.variants?.[0]?.title;
		var item_price = product.variants?.[0]?.price;
    var item_discount = product.variants?.[0]?.discount_total;
    var item_name = product.title;
		if(variant_id && variant_id != "") {
			var variants = product.variants;
			for(var i = 0; i < variants.length; i++) {
				if(variants[i].id == variant_id) {
					item_price = variants[i].price;
          item_discount = variants[i].discount_total;
					variant_name = variants[i].title;
          item_id = variant_id;
					break;
				}
			}
		} else if (product.selected_variant) {
      item_price = product.selected_variant?.price;
      quantity = product.quantity;
      item_discount = product.selected_variant?.discount_total;
			variant_name = product.selected_variant?.title;
      item_id = product.selected_variant?.id;
    }
    if (isAnalytics) {
      item.item_id = item_id;
      item.item_name = item_name;
      item.price = item_price;
      item.item_variant = variant_name;
      item.quantity = quantity ? quantity : 1;
      item.discount = item_discount;
      // include brand and category once available
    } else {
      item.id = item_id;
      item.item_price = item_price;
      item.quantity = quantity ? quantity : 1;
    }
    return item;
}

function getItemDetailsFromCheckout(product, isAnalytics) {
  let item = {};
  if (isAnalytics) {
    item.item_id = product.item_id;
    item.item_name = product.group_name || product.name;
    item.price = product.rate;
    item.item_variant = product.name;
    item.quantity = product.quantity ? product.quantity : 1;
    item.discount = product.discount
    item.item_category = product.category
  } else {
    item.id = product.item_id;
    item.item_price = product.rate;
    item.quantity = product.quantity ? product.quantity : 1;
  }
  return item;
}

function getShippingTierName(shippingChargeDetails, shippingChargeId) {
  if (!shippingChargeDetails || !shippingChargeId) {
    return '';
  }
  for (let charge of shippingChargeDetails) {
    if (charge.shipping_charge_id === shippingChargeId) {
      return charge.name;
    }
  }
  return '';
}

function pushCheckOutBeginToAnalytics() {
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < window.checkout_data?.line_items?.length; i++) {
      let product = window.checkout_data.line_items[i];
      items.push(getItemDetailsFromCheckout(product, ISANALYTICS));
    }
    dataLayer.push({
      event: "begin_checkout",
      ecommerce: {
        currency: window.checkout_data?.currency_code,
        value: window.checkout_data?.total,
        coupon: window.checkout_data?.coupon?.coupon_code || "",
        items
      }
    });
  }

  if (isPixelEnabled()) {
    let contents = [];
    let content_ids = [];
    for (let i = 0; i < window.checkout_data?.line_items?.length; i++) {
      let product = window.checkout_data.line_items[i];
      contents.push(getItemDetailsFromCheckout(product, !ISANALYTICS));
      content_ids.push(product.item_id);
    }
    fbq("track", "InitiateCheckout", {
      content_ids,
      content_type: "product",
      currency: window.checkout_data?.currency_code,
      value: window.checkout_data?.total,
      num_items: contents.length,
      contents
    });
  }
}

function pushShippingInfoToAnalyics() {
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < window.checkout_data?.line_items?.length; i++) {
      let product = window.checkout_data.line_items[i];
      items.push(getItemDetailsFromCheckout(product, ISANALYTICS));
    }
    dataLayer.push({
      event: "add_shipping_info",
      ecommerce: {
        currency: window.checkout_data?.currency_code,
        value: window.checkout_data?.total,
        coupon: window.checkout_data?.coupon?.coupon_code || "",
        shipping_tier: getShippingTierName(
          window.checkout_data?.shipping_charge_details,
          window.checkout_data?.shipping_charge_id
        ),
        items
      }
    });
  }
}

function pushPaymentInfoToAnalyics() {
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < window.payment_status?.line_items?.length; i++) {
      let product = window.payment_status.line_items[i];
      items.push(getItemDetailsFromCheckout(product, ISANALYTICS));
    }
    dataLayer.push({
      event: "add_payment_info",
      ecommerce: {
        currency: window.payment_status?.currency_code,
        value: window.payment_status?.total,
        coupon: window.payment_status?.coupon_code || "",
        payment_type: window.payment_status?.payment_mode,
        items
      }
    });
  }

  if (isPixelEnabled()) {
    let contents = [];
    let content_ids = [];
    for (let i = 0; i < window.payment_status?.line_items?.length; i++) {
      let product = window.payment_status.line_items[i];
      contents.push(getItemDetailsFromCheckout(product, !ISANALYTICS));
      content_ids.push(product.item_id);
    }
    fbq("track", "AddPaymentInfo", {
      content_ids,
      content_type: "product",
      currency: window.payment_status?.currency_code,
      value: window.payment_status?.total,
      num_items: window.payment_status?.line_items?.length,
      payment_type: window.payment_status?.payment_mode,
      contents
    });
  }
}

function pushPurchaseInfoToAnalyics() {
  if (isAnalyticsEnabled()) {
    let items = [];
    for (let i = 0; i < window.payment_status?.line_items?.length; i++) {
      let product = window.payment_status.line_items[i];
      items.push(getItemDetailsFromCheckout(product, ISANALYTICS));
    }
    dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: window.payment_status?.salesorder_id,
        value: window.payment_status?.total,
        shipping: window.payment_status?.shipping_details?.shipping_rate_formatted || "",
        currency: window.payment_status?.currency_code,
        coupon: window.payment_status?.coupon_code || "",
        items
      }
    });
  }

  if (isPixelEnabled()) {
    let contents = [];
    let content_ids = [];
    for (let i = 0; i < window.payment_status?.line_items?.length; i++) {
      let product = window.payment_status.line_items[i];
      contents.push(getItemDetailsFromCheckout(product, !ISANALYTICS));
      content_ids.push(product.item_id);
    }
    fbq("track", "Purchase", {
      content_ids,
      content_type: "product",
      currency: window.payment_status?.currency_code,
      value: window.payment_status?.total,
      num_items: window.payment_status?.line_items?.length,
      contents,
      order_id: window.payment_status?.salesorder_id
    });
  }
}

async function getProductData(productId) {
  let response = await fetch(`${window.origin}/products/${productId}?format=json`);
  let json = await response.json();
  return json.product;
}

async function getListData() {
  let url = window.location.href;
  if (url.includes("?")) {
    url = url + "&format=json";
  } else {
    url = url + "?format=json";
  }
  let response = await fetch(url);
  let json = await response.json();
  if (url.includes("/search")) {
    return json.search;
  } else if (url.includes("/collections/")) {
    return json.collection;
  } else if (url.includes("/categories/")) {
    return json.category;
  }
}

async function getCartData() {
  let response = await fetch(`${window.origin}/cart?format=json`);
  let json = await response.json();
  return json.cart;
}

async function getCheckoutData() {
  let response = await fetch(`${window.origin}/checkout?format=json`);
  let json = await response.json();
  return json.checkout;
}

async function getPaymentData() {
  let url = window.location.href;
  if (url.includes("?")) {
    url = url + "&format=json";
  } else {
    url = url + "?format=json";
  }
  let response = await fetch(url);
  let json = await response.json();
  return json.payment_status;
}

function isPixelEnabled() {
  return (typeof fbq != "undefined") ? true : false;
}

function isAnalyticsEnabled() {
  return (typeof dataLayer != "undefined") ? true : false;
}
