// Authentication UI & Forms Controller
import { api } from './api.js';
import { setUser } from './state.js';
import { toast } from './utils/toast.js';
import { validators } from './utils/validators.js';
import { storage } from './utils/storage.js';
import { STORAGE_KEYS } from './config.js';

/**
 * Render the login or register page layout
 * @param {HTMLElement} container 
 * @param {string} view - 'login' or 'register'
 */
export function renderAuth(container, view = 'login') {
    container.innerHTML = `
        <div class="auth-container card">
            <div class="auth-tabs">
                <div class="auth-tab ${view === 'login' ? 'active' : ''}" id="tab-login">Login</div>
                <div class="auth-tab ${view === 'register' ? 'active' : ''}" id="tab-register">Register</div>
            </div>
            
            <div class="auth-forms">
                <!-- Login Form -->
                <form id="login-form" class="${view === 'login' ? '' : 'hidden'}">
                    <div class="form-group">
                        <label for="login-identifier">Username or Email</label>
                        <input type="text" id="login-identifier" class="form-control" placeholder="Enter username or email" required autocomplete="username">
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" class="form-control" placeholder="Enter password" required autocomplete="current-password">
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> Log In
                    </button>
                </form>

                <!-- Register Form -->
                <form id="register-form" class="${view === 'register' ? '' : 'hidden'}" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="reg-fullname">Full Name</label>
                        <input type="text" id="reg-fullname" class="form-control" placeholder="Enter full name" required>
                    </div>

                    <div class="form-group">
                        <label for="reg-username">Username</label>
                        <input type="text" id="reg-username" class="form-control" placeholder="Choose username" required autocomplete="username">
                    </div>

                    <div class="form-group">
                        <label for="reg-email">Email Address</label>
                        <input type="email" id="reg-email" class="form-control" placeholder="Enter email" required autocomplete="email">
                    </div>

                    <div class="form-group">
                        <label for="reg-password">Password</label>
                        <input type="password" id="reg-password" class="form-control" placeholder="Create password (min 6 characters)" required autocomplete="new-password">
                    </div>

                    <div class="form-group">
                        <label for="reg-avatar">Profile Avatar</label>
                        <input type="file" id="reg-avatar" class="form-control" accept="image/*">
                    </div>

                    <!-- Default Address Book Entry -->
                    <div class="addresses-group">
                        <h4 style="margin-bottom: 0.8rem; font-size: 0.95rem; font-family: 'Outfit';">Primary Address</h4>
                        
                        <div class="form-group" style="margin-bottom: 0.8rem;">
                            <input type="text" id="reg-address-line" class="form-control" placeholder="Street Address" required>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 0.8rem;">
                            <input type="text" id="reg-city" class="form-control" placeholder="City" required>
                            <input type="text" id="reg-state" class="form-control" placeholder="State" required>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                            <input type="text" id="reg-country" class="form-control" placeholder="Country" required>
                            <input type="text" id="reg-postal" class="form-control" placeholder="Postal Code" required>
                        </div>

                        <div class="form-group" style="margin-top: 0.8rem; margin-bottom: 0;">
                            <input type="tel" id="reg-phone" class="form-control" placeholder="Phone Number" required>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">
                        <i class="fa-solid fa-user-plus"></i> Create Account
                    </button>
                </form>
            </div>
        </div>
    `;

    setupEventListeners();
}

function setupEventListeners() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Tab switching
    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            window.location.hash = '#/login';
        });
        tabRegister.addEventListener('click', () => {
            window.location.hash = '#/register';
        });
    }

    // Login Submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const identifier = document.getElementById('login-identifier').value.trim();
            const password = document.getElementById('login-password').value;

            if (!identifier || !password) {
                toast.error('All fields are required.');
                return;
            }

            const payload = {};
            if (validators.isValidEmail(identifier)) {
                payload.email = identifier;
            } else {
                payload.username = identifier;
            }
            payload.password = password;

            try {
                const res = await api.auth.login(payload);
                if (res && res.data) {
                    // Store mock access token to trigger session persistence
                    storage.set(STORAGE_KEYS.ACCESS_TOKEN, 'session_active');
                    setUser(res.data);
                    
                    // Fetch cart right away to sync header badge
                    try {
                        const cartRes = await api.cart.get();
                        if (cartRes && cartRes.data) {
                            import('./state.js').then(m => m.setCart(cartRes.data));
                        }
                    } catch {
                        // Ignore cart errors
                    }

                    toast.success('Welcome back!');
                    window.location.hash = '#/';
                }
            } catch (err) {
                toast.error(err.message || 'Login failed. Please check credentials.');
            }
        });
    }

    // Register Submit
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('reg-fullname').value.trim();
            const username = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            
            const avatarFile = document.getElementById('reg-avatar').files[0];

            // Address values
            const addressLine = document.getElementById('reg-address-line').value.trim();
            const city = document.getElementById('reg-city').value.trim();
            const stateVal = document.getElementById('reg-state').value.trim();
            const country = document.getElementById('reg-country').value.trim();
            const postalCode = document.getElementById('reg-postal').value.trim();
            const phoneNumber = document.getElementById('reg-phone').value.trim();

            // Validation
            const missing = validators.getMissingFields({ fullName, username, email, password, addressLine, city, stateVal, country, postalCode, phoneNumber });
            if (missing.length > 0) {
                toast.error('Please fill in all required fields.');
                return;
            }

            if (!validators.isValidEmail(email)) {
                toast.error('Please enter a valid email address.');
                return;
            }

            if (!validators.isValidPassword(password)) {
                toast.error('Password must be at least 6 characters.');
                return;
            }

            // Construct FormData payload
            const formData = new FormData();
            formData.append('fullName', fullName);
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            // Stringify address array (matching backend validation req.body.addresses parsing)
            const addresses = [
                {
                    country,
                    city,
                    state: stateVal,
                    postalCode,
                    addressLine,
                    phoneNumber
                }
            ];
            formData.append('addresses', JSON.stringify(addresses));

            try {
                const res = await api.auth.register(formData);
                if (res && res.statusCode === 201) {
                    toast.success('Registration successful! Please login.');
                    window.location.hash = '#/login';
                }
            } catch (err) {
                toast.error(err.message || 'Registration failed.');
            }
        });
    }
}
