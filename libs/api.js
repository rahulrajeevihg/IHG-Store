import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { domain, typesense_api_key, website } from "./config/siteConfig"
import { handleUnauthorizedResponse } from "./auth";

// All ERP calls go through our cookie-forwarding proxy.
// The proxy handler is at pages/api/erp/[...path].js, mounted at /api/erp/.
// It forwards req.headers.cookie verbatim to the ERP server so the 'sid'
// session cookie is preserved and 'User None is disabled' errors are eliminated.
const methodUrl = `/api/erp/api/method/`;
const resourceUrl = `/api/erp/api/resource/`;
const domainUrl = domain;
let sitename = "igh_search.igh_search"
// let sitename="go1_commerce.go1_commerce"

const apiUrl_common = `${sitename}.api.`
const apiUrl_carts = `${sitename}.api.`
const apiUrl_customer = `${sitename}.api.`
const apiUrl_product = `${sitename}.api.`
const apiUrl_category = `${sitename}.api.`
const apiUrl_checkout = `${sitename}.api.`
const apiUrl_orders = `${sitename}.api.`
const apiUrl_vendors = `${sitename}.api.`
const apiUrl_masters = `${sitename}.api.`
const apiUrl_mobileapi = `${sitename}.api.`
const apiUrl_api = `${sitename}.api.`
const apiUrl_api_url = `${sitename}.api`


export const checkMobile = () => {
    if (window.innerWidth < 767) {
        return true;
    } else if (window.innerWidth > 767) {
        return false;
    }
}

export const currencyFormatter1 = (amount, currencyCode = 'INR') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'AED',
        // currency: currencyCode,
    }).format(amount);
};

export const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
});

export const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

export async function check_count(quantity, type) {
    let count = quantity
    if (type == 'inc') {
        count = quantity + 1;
    } else if (type == 'dec') {
        count = quantity - 1;
    }
    return count;
}

export function stored_customer_info() {
    let users = {}
    users.cust_email = localStorage['CustomerId'] ? localStorage['CustomerId'] : undefined;
    users.user_id = localStorage['customerUser_id'] ? localStorage['customerUser_id'] : undefined;
    users.cust_name = localStorage['CustomerName'] ? localStorage['CustomerName'] : undefined;
    users.customer_id = localStorage['customerRefId'] ? localStorage['customerRefId'] : undefined;

    users.address = localStorage['address'] ? localStorage['address'] : undefined;
    users.city = localStorage['city'] ? localStorage['city'] : undefined;
    users.state = localStorage['state'] ? localStorage['state'] : undefined;
    users.country = localStorage['country'] ? localStorage['country'] : undefined;
    users.zipcode = localStorage['zipcode'] ? localStorage['zipcode'] : undefined;
    users.business = localStorage['business'] ? localStorage['business'] : undefined;
    return users;
}

export function stored_locations_info(location) {
    if (location.business) {
        localStorage['business'] = location.business
    }
    localStorage['address'] = location.address ? location.address : undefined;
    localStorage['city'] = location.city ? location.city : undefined;
    localStorage['state'] = location.state ? location.state : undefined;
    localStorage['country'] = location.country ? location.country : undefined;
    localStorage['zipcode'] = location.zipcode ? location.zipcode : undefined;
}

export function storeCustomerInfo(resp) {
    localStorage['CustomerId'] = resp.message[0].email;
    localStorage['email'] = resp.message[0].email;
    localStorage['CustomerName'] = resp.message[0].full_name;
    localStorage['referral_code'] = resp.message[0].referral_code
    localStorage['Customerphone'] = resp.message[0].phone;
    localStorage['Customerfirst_name'] = resp.message[0].first_name
    localStorage['Customerlast_name'] = resp.message[0].last_name
    localStorage['customerRefId'] = resp.message[0].name
    localStorage['customerUser_id'] = resp.message[0].user_id;
    let business_addr_info = {};
    business_addr_info.business_name = resp.message[0].business_name
    business_addr_info.business_phone = resp.message[0].business_phone
    business_addr_info.business_address = resp.message[0].business_address
    business_addr_info.business_landmark = resp.message[0].business_landmark
    business_addr_info.business_city = resp.message[0].business_city
    business_addr_info.business_state = resp.message[0].business_state
    business_addr_info.business_zip = resp.message[0].business_zip
    business_addr_info.business_country = resp.message[0].business_country
    localStorage['Business_address'] = JSON.stringify(business_addr_info);
    localStorage.removeItem('guestRefId');
}

export const check_Image = (Image) => {
    let baseUrl = `http://${domain}`
    if (Image && Image != '') {
        if (Image.indexOf('https') == -1) {
            return baseUrl + Image;
        } else if (Image.indexOf('https') == 0) {
            return Image;
        }
    } else {
        return '/empty-states.png'
    }
}

export const seo_Image = (Image) => {
    let baseUrl = `http://${domain}`
    if (Image) {
        if (Image.indexOf('https') == -1) {
            return baseUrl + Image;
        } else if (Image.indexOf('https') == 0) {
            return Image;
        }
    } else {
        return baseUrl + '/empty-states.png'
    }
}

export const getCurrentUrl = (URl) => {
    return website + URl
}

export function getColor(value) {
    if (value == 'Paid' || value == 'success' || value == 'Active' || value == 'Completed' || value == "Debited") {
        return '#037D00'
    } else if (value == 'Pending' || value == 'Cancelled') {
        return '#ff0000a3'
    } else if (value == 'Unpaid') {
        return '#E1590D'
    } else if (value == 'Shipped' || value == 'Placed') {
        return '#e0d9cec2'
    } else if (value == 'Order Delivered') {
        return '#02b290'
    } else if (value == 'Pending') {
        return '#ff0000a3'
    } else if (value == 'Credited') {
        return '#FFA500'
    }
    else {
        return '#ddd'
    }
}


export async function get_razorpay_settings() {
    let razorpay_settings;
    const resp = await get_razorpaysetting();
    if (resp && resp.message) {
        return razorpay_settings = resp.message;
    }
}

export async function checkCart(id, array) {
    var cnt = 0;
    array = [...array.marketplace_items, ...array.fl_items];
    array.find(res => { if (res.product == id && res.is_free_item != 1) { cnt += res.quantity } })
    return cnt;
}

/**
 * postMethod — sends a POST request through the ERP cookie-forwarding proxy.
 *
 * Authentication strategy:
 *   Relies entirely on the HttpOnly `sid` session cookie set by the Frappe
 *   server after login. The proxy forwards req.headers.cookie verbatim so the
 *   ERP sees the valid session. No Authorization header is used here.
 */
export async function postMethod(api, payload) {
    try {
        if (!api || typeof api !== 'string') {
            throw new Error('Invalid API endpoint');
        }

        // Hard guard: cart update is write-only and must never be called as query-string GET style.
        if (api.includes('update_cartitem') && api.includes('?')) {
            throw new Error('update_cartitem must be called via POST body, not query params');
        }

        const body = (typeof payload === 'object') ? JSON.stringify(payload) : payload;

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        // Frappe requires X-Frappe-CSRF-Token for all non-GET requests.
        // Read it directly from document.cookie so we always send the current value.
        const csrfCookie = document.cookie.split(';').find(c => c.trim().startsWith('csrf_token='));
        if (csrfCookie) {
            headers['X-Frappe-CSRF-Token'] = decodeURIComponent(csrfCookie.split('=').slice(1).join('=').trim());
        }

        const response = await fetch(api, {
            method: 'POST',
            headers,
            body,
            credentials: 'include',
            redirect: 'error',
        });

        if (api.includes('update_cartitem')) {
            console.info('[postMethod] update_cartitem request sent as POST', { api });
        }

        if (handleUnauthorizedResponse(response)) {
            return;
        }

        // Guard against HTML error pages (auth/proxy failures)
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const rawText = await response.text();
            console.error('[postMethod] Non-JSON response:', rawText.slice(0, 500));
            toast.error('Unexpected server response. Please try again.');
            return { message: { status: 'error', message: 'Non-JSON response from server.' } };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        const rawMessage = error?.message || 'Unknown API error';
        const message = /redirect/i.test(rawMessage)
            ? 'Request was redirected before reaching ERP. Please verify API URL/proxy settings.'
            : rawMessage;
        toast.error(message);
        return { message: { status: 'error', message } };
    }
}


/**
 * get — sends a GET request through the ERP cookie-forwarding proxy.
 * The browser's sid cookie is forwarded by the proxy; no Authorization header needed.
 */
export async function get(api) {
    const response = await fetch(api, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
    });
    if (handleUnauthorizedResponse(response)) {
        return;
    }
    // Guard against HTML error pages
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const rawText = await response.text();
        console.error('[get] Non-JSON response:', rawText.slice(0, 500));
        return null;
    }
    const data = await response.json();
    return data;
}

async function parseJsonResponseSafe(response, contextLabel = 'api') {
    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    if (!contentType.includes('application/json')) {
        console.error(`[${contextLabel}] Non-JSON response:`, rawText.slice(0, 500));
        return null;
    }

    try {
        return JSON.parse(rawText);
    } catch (error) {
        console.error(`[${contextLabel}] Invalid JSON response:`, error?.message, rawText.slice(0, 500));
        return null;
    }
}



export async function HomePage(data) {
    let api = methodUrl + 'go1_cms.go1_cms.api.get_page_content';
    // let api = methodUrl + 'ecommerce_business_store.ecommerce_business_store.v2.common.get_page_content_with_pagination';
    return await postMethod(api, data)
}

export async function BlogList(data) {
    let api = methodUrl + apiUrl_common + 'get_blog_list';
    return await postMethod(api, data)

}

export async function blog_details(data) {
    let api = methodUrl + apiUrl_common + 'get_blog_details';
    return await postMethod(api, data)

}

export async function post_comments(data) {
    let api = methodUrl + apiUrl_common + 'insert_blog_comments';
    return await postMethod(api, data)

}


export async function BlogCategories() {
    let api = methodUrl + apiUrl_common + 'get_blog_categories';
    return await get(api)
}


export async function websiteSettings() {
    let api = methodUrl + apiUrl_common + 'get_all_website_settings';
    return await get(api)
}

export async function getDashBoardData() {
    let api = methodUrl + apiUrl_customer + 'get_customer_dashboard'
    return await get(api)
}

export async function forgetPassword(data) {
    let api = methodUrl + apiUrl_common + 'send_user_forget_pwd_mail';
    return await postMethod(api, data)
}

export async function get_category_products(data) {
    // this.website_settings.enable_multi_store == 1 ? data.business = this.businessId : null;
    let api = methodUrl + apiUrl_product + 'get_category_products';
    return await postMethod(api, data)
}

export async function get_product_detail(data) {
    let api = methodUrl + apiUrl_product + 'get_product_details';
    return await postMethod(api, data)
}

export async function get_product_other_info(data) {
    let api = methodUrl + apiUrl_product + 'get_product_other_info';
    return await postMethod(api, data)
}

export async function get_product_reviews_list(data) {
    let api = methodUrl + 'ecommerce_business_store.ecommerce_business_store.doctype.product.product.get_product_reviews_list';
    return await postMethod(api, data)
}

export async function get_product_enquiries(data) {
    let api = methodUrl + apiUrl_mobileapi + 'get_product_enquiries';
    return await postMethod(api, data)
}



export async function get_cart_items() {
    const customerId = localStorage['customerRefId'];
    const base = methodUrl + apiUrl_carts + 'get_cart_items';
    const api = customerId ? `${base}?customer_id=${encodeURIComponent(customerId)}` : base;
    return await get(api);
}

export async function insert_cart_items(data) {
    let api = methodUrl + apiUrl_carts + 'insert_cart_items';
    return await postMethod(api, data)
}

export async function update_cartitem(data) {
    let api = methodUrl + apiUrl_carts + 'update_cartitem';
    return await postMethod(api, data)
}

export async function delete_cart_items(data) {
    let api = methodUrl + apiUrl_carts + 'delete_cart_items';
    return await postMethod(api, data)
}

export async function move_item_to_cart(data) {
    let api = methodUrl + apiUrl_carts + 'move_item_to_cart';
    return await postMethod(api, data)
}

export async function move_all_tocart(data) {
    let api = methodUrl + apiUrl_carts + 'move_all_tocart';
    return await postMethod(api, data)
}

export async function clear_cartitem(data) {
    let api = methodUrl + apiUrl_carts + 'clear_cartitem';
    return await postMethod(api, data)
}

export async function clear_cart() {
    let api = methodUrl + 'igh_search.api.clear_cart';
    return await postMethod(api, {})
}

export async function validate_attributes_stock(data) {
    let api = methodUrl + apiUrl_orders + 'validate_attributes_stock_mob';
    return await postMethod(api, data)
}

export async function get_category_filters(data) {
    let api = methodUrl + apiUrl_category + 'get_category_filters';
    return await postMethod(api, data)
}

export async function get_customer_info(data) {
    let api = methodUrl + apiUrl_customer + 'get_customer_info';
    return await postMethod(api, data)
}

export async function get_customer_order_list(data) {
    let api = methodUrl + apiUrl_customer + 'get_customer_order_list'
    return await postMethod(api, data)
}



export async function get_order_info(data) {
    let api = methodUrl + apiUrl_customer + 'get_order_info'
    return await postMethod(api, data)
}

export async function update_password(data) {
    let api = methodUrl + apiUrl_customer + 'update_password';
    // let api = methodUrl + apiUrl_api + 'update_password'
    return await postMethod(api, data)
}

export async function update_order_status(data) {
    let api = methodUrl + apiUrl_api + 'update_order_status'
    return await postMethod(api, data)
}

export async function get_payment_method() {
    let data = { domain: domainUrl }
    let api = methodUrl + apiUrl_checkout + 'get_payment_methods';
    return await postMethod(api, data)
}

export async function delete_address(data) {
    let api = methodUrl + apiUrl_customer + 'delete_address'
    return await postMethod(api, data)
}

export async function get_shipping_methods(data) {
    let api = methodUrl + apiUrl_checkout + 'get_shipping_methods'
    return await postMethod(api, data)
}

export async function get_cart_delivery_slots(data) {
    let api = methodUrl + apiUrl_checkout + 'get_cart_delivery_slots'
    return await postMethod(api, data)
}

export async function insert_address(data) {
    let datas = { data: JSON.stringify(data) }
    let api = methodUrl + apiUrl_customer + 'insert_address'
    return await postMethod(api, datas)
}

export async function update_address(data) {
    let datas = { data: JSON.stringify(data) }
    let api = methodUrl + apiUrl_customer + 'update_address'
    return await postMethod(api, datas)
}

export async function insertOrder(data) {
    let datas = { data: JSON.stringify(data) }
    // let api =  methodUrl + apiUrl_api + 'insert_order'
    let api = methodUrl + apiUrl_orders + 'insert_order'
    return await postMethod(api, datas)
}


export async function get_razorpaysetting(data) {
    let api = methodUrl + apiUrl_common + 'razor_pay_settings'
    return await get(api)
}

export async function get_country_list() {
    let api = methodUrl + apiUrl_common + 'get_country_list';
    return await get(api)
}

export async function get_country_states(data) {
    let api = methodUrl + apiUrl_common + 'get_country_states?country=' + data;
    return await get(api)
}

export async function get_transaction_details(data) {
    let api = methodUrl + 'ecommerce_business_store.accounts.api.get_wallet_details'
    return await postMethod(api, data)
}

export async function get_wallet_details() {
    let api = methodUrl + apiUrl_customer + 'get_wallet_details';
    return await get(api)
}

/**
 * login — Frappe standard session login.
 *
 * POSTs form-encoded credentials to /api/method/login.
 * On success, Frappe sets an HttpOnly `sid` cookie — we do NOT parse or store it.
 * All subsequent API calls rely on credentials:'include' + the proxy forwarding cookies.
 *
 * Returns the parsed JSON body on success, or { _error: true, _raw: <text> } on
 * non-JSON responses (e.g. HTML error pages from a misconfigured proxy).
 */
export async function login(data) {
    const usr = data?.email || '';
    const pwd = data?.pwd || '';

    const api = `${methodUrl}login`;

    // Frappe login endpoint requires application/x-www-form-urlencoded
    const body = new URLSearchParams({ usr, pwd }).toString();

    try {
        const response = await fetch(api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body,
            credentials: 'include',
        });

        const contentType = response.headers.get('content-type') || '';
        const rawText = await response.text();
        if (!contentType.includes('application/json')) {
            console.error('[login] Non-JSON response (auth/proxy failure):', rawText.slice(0, 500));
            return { _error: true, _raw: rawText, message: { message: 'Login failed: unexpected server response.' } };
        }

        try {
            return JSON.parse(rawText);
        } catch (parseError) {
            console.error('[login] Invalid JSON payload:', parseError?.message, rawText.slice(0, 500));
            return {
                _error: true,
                _raw: rawText,
                message: { message: 'Login failed: invalid server response.' }
            };
        }
    } catch (error) {
        console.error('[login] Network error:', error);
        return { _error: true, message: { message: error.message } };
    }
}

/**
 * logout — Frappe standard session logout.
 *
 * POSTs to /api/method/logout so the server invalidates the `sid` cookie.
 * The browser's HttpOnly cookie is automatically cleared by the server's Set-Cookie header.
 */
export async function logout() {
    try {
        await fetch(`${methodUrl}logout`, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            credentials: 'include',
        });
    } catch (error) {
        console.error('[logout] Error calling logout endpoint:', error);
    }
}

export async function social_login(data) {
    let api = methodUrl + apiUrl_mobileapi + "social_login_customer"
    return await postMethod(api, data)
}

export async function send_otp(data) {
    let api = methodUrl + apiUrl_customer + 'send_otp';
    return await postMethod(api, data)
}

export async function verify_otp(data) {
    let api = methodUrl + apiUrl_customer + 'verify_otp';
    return await postMethod(api, data)
}

export async function registerUser(datas) {
    let data = { data: JSON.stringify(datas) }
    let api = methodUrl + apiUrl_customer + 'insert_customers'
    return await postMethod(api, data)
}

export async function update_doc(datas) {
    let data = { doc: JSON.stringify(datas) }
    let api = methodUrl + apiUrl_common + 'update_doc'
    return await postMethod(api, data)
}

export async function calculate_shipping_charges(data) {
    let api = methodUrl + apiUrl_checkout + 'calculate_shipping_charges'
    return await postMethod(api, data)
}

export async function validate_coupon(data) {
    let api = methodUrl + apiUrl_checkout + 'validate_coupon'
    return await postMethod(api, data)
}

export async function get_order_discount(data) {
    let api = methodUrl + apiUrl_checkout + 'get_order_discount'
    return await postMethod(api, data)
}

export async function insert_review(data) {
    let api = methodUrl + apiUrl_product + 'insert_review'
    return await postMethod(api, data)
}

export async function insert_questionaproduct(data) {
    let api = methodUrl + apiUrl_api + 'insert_questionaproduct'
    return await postMethod(api, data)
}

export async function get_vendor_details(data) {
    let api = methodUrl + apiUrl_product + 'get_vendor_details'
    return await postMethod(api, data)
}

export async function reorder(data) {
    let api = methodUrl + apiUrl_orders + 'reorder'
    return await postMethod(api, data)
}

export async function cancel_order(data) {
    let api = methodUrl + apiUrl_customer + 'cancel_order'
    return await postMethod(api, data)
}

export async function create_return_request(data) {
    let api = methodUrl + apiUrl_orders + 'create_return_request'
    return await postMethod(api, data)
}

export async function get_return_request_info(data) {
    let api = methodUrl + apiUrl_orders + 'get_return_request_info?order_id=' + data.order_id
    return await get(api)
    // let api = methodUrl + apiUrl_orders + 'get_return_request_info'
    // return await postMethod(api, data)
}

export async function cancelReasonlist() {
    let api = methodUrl + apiUrl_masters + 'get_cancel_reasons'
    return await get(api)
}

export async function returnReasonlist() {
    let api = methodUrl + apiUrl_mobileapi + 'get_return_request_details'
    return await get(api)
}

export async function get_search_products(data) {
    let api = methodUrl + apiUrl_product + 'get_search_products'
    return await postMethod(api, data)
}

export async function get_brand_based_products(data) {
    let api = methodUrl + apiUrl_product + 'get_brand_based_products'
    return await postMethod(api, data)
}

export async function ai_product_search(data) {
    let api = methodUrl + 'igh_search.igh_search.api.ai_product_search';
    return await postMethod(api, data)
}

export async function insert_email_subscription(data) {
    let api = methodUrl + apiUrl_api + 'insert_email_subscription';
    return await postMethod(api, data)
}

export async function enquiry_data(data) {
    let api = methodUrl + apiUrl_customer + 'insert_contact_enquiry'
    return await postMethod(api, data)
}

export async function login_seller(data) {
    let api = methodUrl + apiUrl_mobileapi + 'login_customer'
    return await postMethod(api, data)
}

export async function pincode_availability(zipcode) {
    let data = { zipcode: zipcode }
    let api = methodUrl + apiUrl_api + 'check_pincode_availability'
    return await postMethod(api, data)
}

export async function typesense_search_items(queryParams) {
    let apikey;
    let secret;
    if (typeof window !== 'undefined') {
        apikey = localStorage['api_key'] ? localStorage['api_key'] : undefined;
        secret = localStorage['api_secret'] ? localStorage['api_secret'] : undefined;
    }
    // https://search-ihg.tridotstech.com
    // let api = `http://178.128.108.196:8108/collections/product/documents/search?${queryParams.toString()}`
    // let api = `https://search.ihgind.com/collections/product/documents/search?${queryParams.toString()}`
    let api = `/search-api/collections/product/documents/search?${queryParams.toString()}`
    const myHead = new Headers({ "Content-Type": "application/json", "x-typesense-api-key": "gjbRIS6NQkArF5lJx08U7bVJgg8beTIFFvQVBf7xdKiIWNb8" })
    // const myHead = new Headers({ "Content-Type": "application/json", "x-typesense-api-key": "qfqPMOHSbj9tRobC9YW126qgYzHsPyhLU2FMKxmzJCh7QO0T" })
    const response = await fetch(api, { method: 'GET', headers: myHead })
    return await parseJsonResponseSafe(response, 'typesense_search_items')
}

export async function get_all_masters(router) {
    const api = `/api/erp/api/method/igh_search.igh_search.api.get_all_masters`;
    const response = await fetch(api, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
    });
    if (handleUnauthorizedResponse(response)) {
        return;
    }
    return await parseJsonResponseSafe(response, 'get_all_masters');
}


export async function get_all_category() {
    const api = `/api/erp/api/resource/Item%20Group?filters=[[%22name%22,%22!=%22,%22All%20Item%20Groups%22]]`;
    const response = await fetch(api, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
    });
    return await parseJsonResponseSafe(response, 'get_all_category');
}


export async function get_product_details(code) {
    const api = `/api/erp/api/method/igh_search.igh_search.api.get_product_info`;
    const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ item_code: code }),
        credentials: 'include',
    });
    return await parseJsonResponseSafe(response, 'get_product_details');
}

export async function get_brands_list(keys, data) {
    const api = `/api/erp/api/method/get_brands`;
    const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
    });
    return await parseJsonResponseSafe(response, 'get_brands_list');
}
export async function get_user_opportunities() {
    let api = methodUrl + 'igh_search.api.get_user_opportunities';
    return await get(api);
}

export async function search_opportunities(search, customer_id) {
    let api = methodUrl + 'igh_search.igh_search.api.search_opportunities';
    return await postMethod(api, { search, customer_id: customer_id || '' });
}

export async function create_quotation_from_portal(payload) {
    let api = methodUrl + 'igh_search.api.create_quotation_from_portal';
    const resp = await postMethod(api, payload);
    return resp;
}
