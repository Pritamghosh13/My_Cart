// Core Fetch API Wrapper Client
import { API_BASE_URL } from './config.js';
import { loader } from './utils/loader.js';
import { toast } from './utils/toast.js';

// Queuing variables for handling token refresh concurrency
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

/**
 * Handle HTTP response and parse errors
 * @param {Response} response 
 * @returns {Promise<any>}
 */
async function handleResponse(response) {
    let data;
    try {
        data = await response.json();
    } catch {
        // In case the response is not valid JSON
        data = { message: 'Failed to parse server response' };
    }

    if (!response.ok) {
        const errorMessage = data.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
    }

    return data;
}

/**
 * Perform an HTTP Request
 * @param {string} endpoint - API endpoint route
 * @param {Object} options - Fetch options
 * @param {boolean} showLoader - Toggle global spinner
 */
async function request(endpoint, options = {}, showLoader = true) {
    if (showLoader) loader.show();

    const url = `${API_BASE_URL}${endpoint}`;
    
    // Create a copy of options to prevent modifying the original options object structure
    const fetchOptions = { ...options };
    if (fetchOptions.headers) {
        fetchOptions.headers = { ...fetchOptions.headers };
    }

    // Set credentials so cookies are sent/received
    fetchOptions.credentials = 'include';

    // Set default headers if body is a plain object (not FormData)
    if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
        fetchOptions.headers = {
            'Content-Type': 'application/json',
            ...fetchOptions.headers
        };
        fetchOptions.body = typeof fetchOptions.body === 'string' ? fetchOptions.body : JSON.stringify(fetchOptions.body);
    }

    try {
        const response = await fetch(url, fetchOptions);

        // Check if unauthorized and token needs refresh
        if (response.status === 401 && 
            endpoint !== '/user/logIn' && 
            endpoint !== '/user/register' && 
            endpoint !== '/user/refresh-token' && 
            !options._retry) {
            
            options._retry = true;

            if (isRefreshing) {
                // Queue this request to wait for the refresh call to finish
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return request(endpoint, options, showLoader);
                }).catch(err => {
                    throw err;
                });
            }

            isRefreshing = true;

            try {
                // Silent refresh tokens
                await request('/user/refresh-token', { method: 'POST' }, false);
                isRefreshing = false;
                processQueue(null);
                
                // Retry the original request
                return await request(endpoint, options, showLoader);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError);
                
                // Refresh failed, log out user
                console.error("Token refresh failed, logging out user...", refreshError);
                const { clearState } = await import('./state.js');
                clearState();
                toast.error("Session expired. Please log in again.");
                window.location.hash = '#/login';
                throw new Error("Session expired");
            }
        }

        return await handleResponse(response);
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    } finally {
        if (showLoader) loader.hide();
    }
}

// API Resource Endpoints
export const api = {
    // === AUTH / USER ENDPOINTS ===
    auth: {
        register(formData) {
            return request('/user/register', {
                method: 'POST',
                body: formData // This is FormData containing images & addresses
            });
        },
        login(credentials) {
            return request('/user/logIn', {
                method: 'POST',
                body: credentials
            });
        },
        refreshToken() {
            return request('/user/refresh-token', {
                method: 'POST'
            }, false);
        },
        logout() {
            return request('/user/logout', {
                method: 'POST'
            });
        },
        getProfile() {
            // Check status without showing the full overlay loader to make transitions seamless
            return request('/user/profile', { method: 'GET' }, false);
        },
        updateProfile(data) {
            return request('/user/profile/update', {
                method: 'PATCH',
                body: data
            });
        },
        updateAvatar(formData) {
            return request('/user/profile/avatar/update', {
                method: 'PATCH',
                body: formData // This is FormData with avatar file
            });
        },
        changePassword(passwords) {
            return request('/user/password/change', {
                method: 'PATCH',
                body: passwords
            });
        },
        deleteAccount() {
            return request('/user/delete-account', {
                method: 'DELETE'
            });
        }
    },

    // === PRODUCT ENDPOINTS ===
    products: {
        getAll(page = 1, limit = 6) {
            return request(`/user/product/get-all?page=${page}&limit=${limit}`, { method: 'GET' }, false);
        },
        getSingle(productId) {
            return request(`/user/product/${productId}`, { method: 'GET' });
        },
        create(formData) {
            return request('/user/product/add', {
                method: 'POST',
                body: formData // FormData for file uploads
            });
        },
        update(productId, formData) {
            return request(`/user/product/update/${productId}`, {
                method: 'PATCH',
                body: formData // FormData
            });
        },
        delete(productId) {
            return request(`/user/product/delete/${productId}`, {
                method: 'DELETE'
            });
        }
    },

    // === CART ENDPOINTS ===
    cart: {
        get() {
            return request('/user/cart/get-cart', { method: 'GET' }, false);
        },
        add(productId, quantity = 1) {
            return request('/user/cart/add', {
                method: 'POST',
                body: { productId, quantity }
            });
        },
        updateQuantity(productId, quantity) {
            return request('/user/cart/update', {
                method: 'PATCH',
                body: { productId, quantity }
            }, false);
        },
        remove(productId) {
            return request(`/user/cart/remove/${productId}`, {
                method: 'PATCH'
            });
        },
        clear() {
            return request('/user/cart/clear-cart', {
                method: 'PATCH'
            });
        }
    },

    // === ORDER ENDPOINTS (Real Backend) ===
    orders: {
        create(orderData) {
            return request('/user/order/create', {
                method: 'POST',
                body: orderData
            });
        },
        getMyOrders() {
            return request('/user/order/my-orders', { method: 'GET' });
        },
        getSingle(orderId) {
            return request(`/user/order/${orderId}`, { method: 'GET' });
        },
        cancel(orderId) {
            return request(`/user/order/cancel/${orderId}`, {
                method: 'PATCH'
            });
        }
    }
};
