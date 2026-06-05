// Hash Routing Engine & Guard Rails
import { api } from './api.js';
import { storage } from './utils/storage.js';
import { STORAGE_KEYS } from './config.js';
import { state, setUser, clearState } from './state.js';
import { toast } from './utils/toast.js';

// Lazy load views to prevent circular dependencies
let views = {};

// Define guard rules for routes
const GUARDED_ROUTES = ['cart', 'profile', 'orders', 'admin'];

/**
 * Perform verification of authentication on startup
 */
async function checkAuthSession() {
    // Check if we have information in localStorage representing a session
    const localUser = storage.get(STORAGE_KEYS.USER_INFO);
    
    if (localUser) {
        // Optimistically set the user state to avoid layout flickers
        setUser(localUser);
        
        try {
            // Confirm session validity with server
            const res = await api.auth.getProfile();
            if (res && res.data) {
                setUser(res.data);
                
                // Fetch the cart as well to synchronize state
                try {
                    const cartRes = await api.cart.get();
                    if (cartRes && cartRes.data) {
                        import('./state.js').then(m => m.setCart(cartRes.data));
                    }
                } catch {
                    // Ignore cart fetching errors on start
                }
            }
        } catch (error) {
            console.warn('Session verification failed on start, logging out.');
            clearState();
            toast.error('Session expired. Please log in again.');
            window.location.hash = '#/login';
        }
    }
}

/**
 * Main routing logic to match URL hashes with modules
 */
async function route() {
    const hash = window.location.hash || '#/';
    const path = hash.substring(2); // Remove '#/'
    
    // Parse path parameters (e.g. product/123, order/123)
    const segments = path.split('/');
    const mainRoute = segments[0] || '';
    const param = segments[1] || '';

    // Handle logout route immediately
    if (mainRoute === 'logout') {
        try {
            await api.auth.logout();
            toast.success('Successfully logged out.');
        } catch (err) {
            // Proceed to clear state anyway
        }
        clearState();
        window.location.hash = '#/login';
        return;
    }

    // Route guards
    if (GUARDED_ROUTES.includes(mainRoute)) {
        if (!state.user) {
            toast.info('Please log in to access this page.');
            window.location.hash = '#/login';
            return;
        }

        if (mainRoute === 'admin' && state.user.role !== 'admin') {
            toast.error('Access Denied. Admins only.');
            window.location.hash = '#/';
            return;
        }
    }

    // Load menu indicator
    updateActiveNavLink(hash);

    const mainContainer = document.getElementById('app');
    if (!mainContainer) return;

    // Load corresponding module and render
    try {
        switch (mainRoute) {
            case '':
            case 'home':
                if (!views.products) views.products = await import('./products.js');
                views.products.renderProductsList(mainContainer);
                break;
                
            case 'product':
                if (!param) {
                    window.location.hash = '#/';
                } else {
                    if (!views.products) views.products = await import('./products.js');
                    views.products.renderProductDetails(mainContainer, param);
                }
                break;
                
            case 'login':
            case 'register':
                if (state.user) {
                    window.location.hash = '#/';
                } else {
                    if (!views.auth) views.auth = await import('./auth.js');
                    views.auth.renderAuth(mainContainer, mainRoute);
                }
                break;
                
            case 'cart':
                if (!views.cart) views.cart = await import('./cart.js');
                views.cart.renderCart(mainContainer);
                break;
                
            case 'profile':
                if (!views.profile) views.profile = await import('./profile.js');
                views.profile.renderProfile(mainContainer);
                break;
                
            case 'orders':
                if (!views.orders) views.orders = await import('./orders.js');
                if (param) {
                    views.orders.renderOrderDetails(mainContainer, param);
                } else {
                    views.orders.renderOrdersList(mainContainer);
                }
                break;
                
            case 'admin':
                if (!views.admin) views.admin = await import('./admin.js');
                views.admin.renderAdminDashboard(mainContainer);
                break;
                
            default:
                // Fallback for 404
                mainContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-triangle-exclamation empty-state-icon"></i>
                        <h3>Page Not Found</h3>
                        <p>The page you are looking for does not exist or has been moved.</p>
                        <a href="#/" class="btn btn-primary">Go to Homepage</a>
                    </div>
                `;
        }
    } catch (e) {
        console.error('Routing load error:', e);
        mainContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation empty-state-icon" style="color: var(--error);"></i>
                <h3>Error Loading Page</h3>
                <p>${e.message || 'An unexpected error occurred while loading this view.'}</p>
                <button onclick="window.location.reload()" class="btn btn-secondary">Retry</button>
            </div>
        `;
    }
}

/**
 * Set active status class on navbar buttons
 */
function updateActiveNavLink(hash) {
    const navLinks = document.querySelectorAll('.nav-link, .nav-btn');
    navLinks.forEach(link => {
        const linkHash = link.getAttribute('href');
        if (linkHash === hash || (hash === '#/' && linkHash === '#/')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Close mobile menu if open
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        navMenu.classList.remove('open');
    }
}

// Wire Event Listeners
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', async () => {
    // Setup Mobile Navigation Menu toggle
    const mobileToggle = document.getElementById('nav-mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('open')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });
    }
    
    // Verify session
    await checkAuthSession();
    
    // Init router
    await route();
});
