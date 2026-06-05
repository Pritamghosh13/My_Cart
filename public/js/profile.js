// User Profile View Controller
import { api } from './api.js';
import { state, setUser, clearState } from './state.js';
import { toast } from './utils/toast.js';
import { validators } from './utils/validators.js';

/**
 * Render the user's profile and settings dashboard
 * @param {HTMLElement} container 
 */
export function renderProfile(container) {
    if (!state.user) {
        window.location.hash = '#/login';
        return;
    }

    const user = state.user;
    const avatarUrl = (user.avatar && user.avatar.url) 
        ? user.avatar.url 
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'; // Default profile img

    container.innerHTML = `
        <h2 style="font-size: 2rem; font-family: 'Outfit'; margin-bottom: 1.5rem;">My Profile</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 3rem; align-items: start;">
            <!-- Profile Avatar Column -->
            <div class="card" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.2rem;">
                <div style="width: 130px; height: 130px; border-radius: 50%; overflow: hidden; border: 3px solid var(--primary); background: rgba(255, 255, 255, 0.05); box-shadow: var(--shadow-glow); display: flex; align-items: center; justify-content: center;">
                    <img src="${avatarUrl}" alt="${user.fullName}" id="profile-avatar-display" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'">
                </div>
                
                <div>
                    <h3 style="font-size: 1.25rem; font-family: 'Outfit';">${user.fullName}</h3>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">@${user.username} &bull; ${user.role.toUpperCase()}</span>
                </div>

                <!-- Update Avatar Form -->
                <form id="avatar-form" style="width: 100%; border-top: 1px solid var(--border-color); padding-top: 1.2rem; display: flex; flex-direction: column; gap: 0.8rem;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="avatar-file" style="cursor: pointer;" class="btn btn-secondary">
                            <i class="fa-solid fa-camera"></i> Select Photo
                        </label>
                        <input type="file" id="avatar-file" accept="image/*" class="hidden">
                    </div>
                    <button type="submit" class="btn btn-primary hidden" id="avatar-submit-btn">
                        Upload Image
                    </button>
                </form>
            </div>

            <!-- Profile Info & Settings Forms -->
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                <!-- Profile Settings -->
                <div class="card">
                    <h3 style="font-family: 'Outfit'; font-size: 1.2rem; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-user-gear" style="color: var(--primary);"></i> Profile Details
                    </h3>
                    
                    <form id="profile-update-form">
                        <div class="form-group">
                            <label for="prof-fullname">Full Name</label>
                            <input type="text" id="prof-fullname" class="form-control" value="${user.fullName}" required>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label for="prof-username">Username</label>
                                <input type="text" id="prof-username" class="form-control" value="${user.username}" required>
                            </div>
                            <div class="form-group">
                                <label for="prof-email">Email Address</label>
                                <input type="email" id="prof-email" class="form-control" value="${user.email}" required>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">
                            Save Changes
                        </button>
                    </form>
                </div>

                <!-- Addresses Review -->
                <div class="card">
                    <h3 style="font-family: 'Outfit'; font-size: 1.2rem; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-map-location-dot" style="color: var(--primary);"></i> Address Book
                    </h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${user.addresses && user.addresses.length > 0 ? user.addresses.map((addr, index) => `
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md); font-size: 0.9rem; line-height: 1.5;">
                                <span style="font-weight: 600; color: var(--primary);">Address #${index + 1}</span><br>
                                ${addr.addressLine}<br>
                                ${addr.city}, ${addr.state} - ${addr.postalCode}<br>
                                ${addr.country}<br>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">Contact: ${addr.phoneNumber}</span>
                            </div>
                        `).join('') : `
                            <p style="color: var(--text-muted); font-size: 0.95rem;">No addresses found in your account.</p>
                        `}
                    </div>
                </div>

                <!-- Password Settings -->
                <div class="card">
                    <h3 style="font-family: 'Outfit'; font-size: 1.2rem; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-shield-halved" style="color: var(--primary);"></i> Change Password
                    </h3>
                    
                    <form id="password-change-form">
                        <div class="form-group">
                            <label for="pass-old">Current Password</label>
                            <input type="password" id="pass-old" class="form-control" placeholder="Enter current password" required autocomplete="current-password">
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label for="pass-new">New Password</label>
                                <input type="password" id="pass-new" class="form-control" placeholder="Create new password" required autocomplete="new-password">
                            </div>
                            <div class="form-group">
                                <label for="pass-confirm">Confirm New Password</label>
                                <input type="password" id="pass-confirm" class="form-control" placeholder="Verify new password" required autocomplete="new-password">
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">
                            Update Password
                        </button>
                    </form>
                </div>

                <!-- Account Danger Settings -->
                <div class="card" style="border-color: rgba(239, 68, 68, 0.2);">
                    <h3 style="font-family: 'Outfit'; font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--error); display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-circle-exclamation"></i> Danger Zone
                    </h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
                        Once you delete your account, there is no going back. All products uploaded by this account, your avatar images, and cart files will be permanently erased.
                    </p>
                    <button class="btn btn-danger" id="delete-account-btn">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    `;

    setupProfileListeners(container);
}

function setupProfileListeners(container) {
    const avatarInput = document.getElementById('avatar-file');
    const avatarSubmit = document.getElementById('avatar-submit-btn');
    const avatarForm = document.getElementById('avatar-form');
    
    const profileForm = document.getElementById('profile-update-form');
    const passwordForm = document.getElementById('password-change-form');
    const deleteBtn = document.getElementById('delete-account-btn');

    // Avatar selection file trigger change
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Show submit button
                if (avatarSubmit) avatarSubmit.classList.remove('hidden');
                
                // Show local preview
                const reader = new FileReader();
                reader.onload = (event) => {
                    const display = document.getElementById('profile-avatar-display');
                    if (display) display.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Avatar Form Submit
    if (avatarForm) {
        avatarForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = avatarInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const res = await api.auth.updateAvatar(formData);
                if (res && res.data) {
                    setUser(res.data);
                    if (avatarSubmit) avatarSubmit.classList.add('hidden');
                    toast.success('Avatar updated successfully!');
                }
            } catch (err) {
                toast.error(err.message || 'Failed to update avatar photo.');
            }
        });
    }

    // Profile info edit
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('prof-fullname').value.trim();
            const username = document.getElementById('prof-username').value.trim();
            const email = document.getElementById('prof-email').value.trim();

            if (!fullName || !username || !email) {
                toast.error('All fields are required.');
                return;
            }

            if (!validators.isValidEmail(email)) {
                toast.error('Please enter a valid email address.');
                return;
            }

            try {
                const res = await api.auth.updateProfile({ fullName, username, email });
                if (res && res.data) {
                    setUser(res.data);
                    toast.success('Profile updated successfully!');
                }
            } catch (err) {
                toast.error(err.message || 'Profile update failed.');
            }
        });
    }

    // Password change
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const oldPassword = document.getElementById('pass-old').value;
            const newPassword = document.getElementById('pass-new').value;
            const confrimPassword = document.getElementById('pass-confirm').value;

            if (newPassword !== confrimPassword) {
                toast.error('Passwords do not match.');
                return;
            }

            if (!validators.isValidPassword(newPassword)) {
                toast.error('New password must be at least 6 characters.');
                return;
            }

            try {
                const res = await api.auth.changePassword({ oldPassword, newPassword, confrimPassword });
                if (res) {
                    toast.success('Password updated successfully!');
                    passwordForm.reset();
                }
            } catch (err) {
                toast.error(err.message || 'Password update failed.');
            }
        });
    }

    // Delete account Zone
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const userConfirm = confirm('WARNING: Are you absolutely sure you want to delete your account? This will log you out, delete all your data, and cannot be undone.');
            
            if (userConfirm) {
                const doubleCheck = prompt('To confirm deletion, please type your username below:');
                if (doubleCheck === state.user.username) {
                    try {
                        const res = await api.auth.deleteAccount();
                        if (res) {
                            toast.success('Your account has been deleted.');
                            clearState();
                            window.location.hash = '#/login';
                        }
                    } catch (err) {
                        toast.error(err.message || 'Failed to delete account.');
                    }
                } else if (doubleCheck !== null) {
                    toast.error('Username mismatch. Deletion cancelled.');
                }
            }
        });
    }
}
