// Global Reactive State Store
import { storage } from './utils/storage.js';
import { STORAGE_KEYS } from './config.js';

// Global state variables
export const state = {
    user: null,
    cart: null,
    products: [],
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
};

// Registered listeners for state changes
const listeners = {
    userChange: [],
    cartChange: []
};

/**
 * Register a callback for user state mutations
 * @param {Function} callback 
 */
export const onUserChange = (callback) => {
    listeners.userChange.push(callback);
    // Trigger immediately with current value
    callback(state.user);
};

/**
 * Register a callback for cart state mutations
 * @param {Function} callback 
 */
export const onCartChange = (callback) => {
    listeners.cartChange.push(callback);
    // Trigger immediately with current value
    callback(state.cart);
};

/**
 * Set current user state and sync with storage
 * @param {Object|null} user 
 */
export const setUser = (user) => {
    state.user = user;
    if (user) {
        storage.set(STORAGE_KEYS.USER_INFO, user);
    } else {
        storage.remove(STORAGE_KEYS.USER_INFO);
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    }
    
    // Notify all user listeners
    listeners.userChange.forEach(cb => cb(user));
    updateNavigationUI();
};

/**
 * Set cart state and trigger badge updates
 * @param {Object|null} cart 
 */
export const setCart = (cart) => {
    state.cart = cart;
    listeners.cartChange.forEach(cb => cb(cart));
    updateCartBadge();
};

/**
 * Set current product list and pagination values
 * @param {Object} data 
 */
export const setProductsData = (data) => {
    state.products = data.products || [];
    state.currentPage = data.currentPage || 1;
    state.totalPages = data.totalPages || 1;
    state.totalProducts = data.totalProduct || 0;
};

/**
 * Clear user session and reset state
 */
export const clearState = () => {
    setUser(null);
    setCart(null);
    state.products = [];
    state.currentPage = 1;
    state.totalPages = 1;
    state.totalProducts = 0;
};

/**
 * Update Cart Badge counter in Header
 */
const updateCartBadge = () => {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    if (state.cart && state.cart.items && state.cart.items.length > 0) {
        // Count total items quantity in cart
        const count = state.cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
    }
};

/**
 * Sync Navigation menus based on authentication status and user roles
 */
const updateNavigationUI = () => {
    const navOrders = document.getElementById('nav-orders-btn');
    const navAdmin = document.getElementById('nav-admin-btn');
    const navProfile = document.getElementById('nav-profile-btn');
    const navAuth = document.getElementById('nav-auth-btn');

    if (state.user) {
        // Logged in
        if (navOrders) navOrders.classList.remove('hidden');
        if (navProfile) navProfile.classList.remove('hidden');
        
        // Show Admin Panel link only if user is an admin
        if (state.user.role === 'admin') {
            if (navAdmin) navAdmin.classList.remove('hidden');
        } else {
            if (navAdmin) navAdmin.classList.add('hidden');
        }

        // Change login button to logout action or profile label
        if (navAuth) {
            navAuth.innerHTML = `<i class="fa-solid fa-arrow-right-from-bracket"></i> Logout`;
            navAuth.href = '#/logout';
            navAuth.className = 'nav-btn btn-danger';
            // Reset background inline styles if any
            navAuth.style.background = '';
        }
    } else {
        // Logged out
        if (navOrders) navOrders.classList.add('hidden');
        if (navAdmin) navAdmin.classList.add('hidden');
        if (navProfile) navProfile.classList.add('hidden');
        
        if (navAuth) {
            navAuth.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket"></i> Login`;
            navAuth.href = '#/login';
            navAuth.className = 'nav-btn';
        }
    }
};
