// Cart and Checkout Views Controller
import { api } from './api.js';
import { state, setCart } from './state.js';
import { toast } from './utils/toast.js';
import { PAYMENT_METHODS } from './config.js';

let isCheckoutMode = false;

/**
 * Render the main Cart view or Checkout panel depending on active sub-state
 * @param {HTMLElement} container 
 */
export async function renderCart(container) {
    isCheckoutMode = false; // Reset to cart view on load
    await loadAndDisplayCart(container);
}

/**
 * Fetch cart from server and render content
 */
async function loadAndDisplayCart(container) {
    container.innerHTML = `
        <h2 style="font-size: 2rem; font-family: 'Outfit'; margin-bottom: 1.5rem;">Shopping Cart</h2>
        <div class="cart-layout" id="cart-content-wrapper">
            <!-- Loading Skeletons -->
            <div class="cart-items-list">
                ${Array(3).fill().map(() => `
                    <div class="cart-item">
                        <div class="skeleton" style="width: 90px; height: 90px; border-radius: var(--radius-md);"></div>
                        <div class="cart-item-details" style="gap: 8px;">
                            <div class="skeleton skeleton-title" style="width: 50%;"></div>
                            <div class="skeleton skeleton-text" style="width: 20%;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="skeleton summary-card" style="height: 250px; width: 100%;"></div>
        </div>
    `;

    try {
        const res = await api.cart.get();
        if (res && res.data) {
            setCart(res.data);
        }
        
        displayCartUI(container);
    } catch (err) {
        // If 404/not found, it means cart is empty/non-existent yet
        setCart(null);
        displayCartUI(container);
    }
}

/**
 * Render Cart page items & invoice details
 */
function displayCartUI(container) {
    const wrapper = document.getElementById('cart-content-wrapper');
    if (!wrapper) return;

    if (!state.cart || !state.cart.items || state.cart.items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-basket-shopping empty-state-icon"></i>
                <h3>Your Cart is Empty</h3>
                <p>Add premium products to your cart and they will appear here!</p>
                <a href="#/" class="btn btn-primary">Browse Products</a>
            </div>
        `;
        return;
    }

    if (isCheckoutMode) {
        renderCheckoutUI(container);
        return;
    }

    // Math calculations
    const itemsPrice = state.cart.items.reduce((total, item) => {
        const p = item.product;
        if (!p) return total;
        return total + (p.price * item.quantity);
    }, 0);
    
    const taxPrice = Math.round(itemsPrice * 0.10); // 10% VAT
    const shippingPrice = itemsPrice > 100 ? 0 : 15; // Free shipping above $100
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    wrapper.innerHTML = `
        <!-- Cart Items List -->
        <div class="cart-items-list">
            ${state.cart.items.map(item => {
                const product = item.product;
                if (!product) return '';
                const mainImg = (product.images && product.images.length > 0) ? product.images[0].url : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';
                
                return `
                    <div class="cart-item" data-id="${product._id}">
                        <div class="cart-item-img-wrapper">
                            <img src="${mainImg}" alt="${product.title}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'">
                        </div>
                        <div class="cart-item-details">
                            <h3 class="cart-item-title">${product.title}</h3>
                            <span class="cart-item-brand" style="font-size: 0.8rem; color: var(--text-muted);">${product.brand || 'Premium Brand'}</span>
                            <span class="cart-item-price">₹${product.price}</span>
                        </div>
                        
                        <div class="quantity-selector" style="margin-right: 1.5rem;">
                            <button class="quantity-btn cart-qty-minus" data-id="${product._id}" data-qty="${item.quantity}">-</button>
                            <span class="quantity-input">${item.quantity}</span>
                            <button class="quantity-btn cart-qty-plus" data-id="${product._id}" data-qty="${item.quantity}">+</button>
                        </div>

                        <i class="fa-solid fa-trash-can cart-item-remove" data-id="${product._id}" title="Remove item"></i>
                    </div>
                `;
            }).join('')}

            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button class="btn btn-secondary" id="clear-cart-btn" style="flex-grow: 1;">
                    <i class="fa-solid fa-broom"></i> Clear Cart
                </button>
                <a href="#/" class="btn btn-secondary" style="flex-grow: 1; text-align: center;">
                    <i class="fa-solid fa-bag-shopping"></i> Continue Shopping
                </a>
            </div>
        </div>

        <!-- Invoice Calculation Summary Card -->
        <div class="summary-card">
            <h3 class="summary-title">Order Summary</h3>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>₹${itemsPrice}</span>
            </div>
            <div class="summary-row">
                <span>Estimated VAT (10%)</span>
                <span>₹${taxPrice}</span>
            </div>
            <div class="summary-row">
                <span>Shipping Fee</span>
                <span>${shippingPrice === 0 ? 'Free' : `₹${shippingPrice}`}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>₹${totalPrice}</span>
            </div>
            
            <button class="btn btn-primary" id="proceed-checkout-btn" style="width: 100%; margin-top: 1rem;">
                <i class="fa-solid fa-lock"></i> Secure Checkout
            </button>
        </div>
    `;

    setupCartListeners(container);
}

function setupCartListeners(container) {
    // Minus qty click
    container.querySelectorAll('.cart-qty-minus').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.getAttribute('data-id');
            const currentQty = parseInt(btn.getAttribute('data-qty'));
            if (currentQty <= 1) {
                // If 1, remove completely
                await removeCartItem(productId, container);
            } else {
                await updateCartItemQty(productId, currentQty - 1, container);
            }
        });
    });

    // Plus qty click
    container.querySelectorAll('.cart-qty-plus').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.getAttribute('data-id');
            const currentQty = parseInt(btn.getAttribute('data-qty'));
            await updateCartItemQty(productId, currentQty + 1, container);
        });
    });

    // Remove icon click
    container.querySelectorAll('.cart-item-remove').forEach(icon => {
        icon.addEventListener('click', async () => {
            const productId = icon.getAttribute('data-id');
            await removeCartItem(productId, container);
        });
    });

    // Clear cart click
    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            try {
                const res = await api.cart.clear();
                if (res) {
                    setCart(null);
                    displayCartUI(container);
                    toast.success('Cart cleared.');
                }
            } catch (err) {
                toast.error('Failed to clear cart.');
            }
        });
    }

    // Checkout click
    const checkoutBtn = document.getElementById('proceed-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            isCheckoutMode = true;
            renderCheckoutUI(container);
        });
    }
}

async function removeCartItem(productId, container) {
    try {
        const res = await api.cart.remove(productId);
        if (res && res.data) {
            setCart(res.data);
            displayCartUI(container);
            toast.success('Item removed from cart.');
        }
    } catch (e) {
        toast.error('Failed to remove item.');
    }
}

async function updateCartItemQty(productId, newQty, container) {
    try {
        const res = await api.cart.updateQuantity(productId, newQty);
        if (res && res.data) {
            setCart(res.data);
            displayCartUI(container);
        }
    } catch (e) {
        toast.error(e.message || 'Failed to update quantity.');
    }
}

/**
 * Render checkout form & confirmation panel
 */
function renderCheckoutUI(container) {
    const itemsPrice = state.cart.items.reduce((total, item) => {
        const p = item.product;
        if (!p) return total;
        return total + (p.price * item.quantity);
    }, 0);
    
    const taxPrice = Math.round(itemsPrice * 0.10);
    const shippingPrice = itemsPrice > 100 ? 0 : 15;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    // Use user's default saved address if available
    const defAddr = (state.user && state.user.addresses && state.user.addresses.length > 0)
        ? state.user.addresses[0]
        : { country: '', city: '', state: '', postalCode: '', addressLine: '', phoneNumber: '' };

    container.innerHTML = `
        <h2 style="font-size: 2rem; font-family: 'Outfit'; margin-bottom: 1.5rem;">Secure Checkout</h2>
        <div class="cart-layout">
            <!-- Shipping Form -->
            <div class="card" style="padding: 2.5rem;">
                <h3 style="margin-bottom: 1.5rem; font-family: 'Outfit'; font-size: 1.3rem;">Shipping Details</h3>
                
                <form id="checkout-shipping-form">
                    <div class="form-group">
                        <label for="ship-address">Street Address</label>
                        <input type="text" id="ship-address" class="form-control" value="${defAddr.addressLine || ''}" required>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="ship-city">City</label>
                            <input type="text" id="ship-city" class="form-control" value="${defAddr.city || ''}" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="ship-state">State / Province</label>
                            <input type="text" id="ship-state" class="form-control" value="${defAddr.state || ''}" required>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="ship-country">Country</label>
                            <input type="text" id="ship-country" class="form-control" value="${defAddr.country || ''}" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="ship-postal">Postal / ZIP Code</label>
                            <input type="text" id="ship-postal" class="form-control" value="${defAddr.postalCode || ''}" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="ship-phone">Contact Phone Number</label>
                        <input type="tel" id="ship-phone" class="form-control" value="${defAddr.phoneNumber || ''}" required>
                    </div>

                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label for="checkout-payment-method">Payment Method</label>
                        <select id="checkout-payment-method" class="filter-select" style="width: 100%;">
                            ${PAYMENT_METHODS.map(method => `<option value="${method.id}">${method.name}</option>`).join('')}
                        </select>
                    </div>

                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="button" class="btn btn-secondary" id="checkout-back-btn" style="flex-grow: 1;">
                            <i class="fa-solid fa-arrow-left"></i> Back to Cart
                        </button>
                        <button type="submit" class="btn btn-primary" style="flex-grow: 2;">
                            Place Order (₹${totalPrice})
                        </button>
                    </div>
                </form>
            </div>

            <!-- Invoice Summary Section -->
            <div class="summary-card">
                <h3 class="summary-title">Order Review</h3>
                <div style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1rem;">
                    ${state.cart.items.map(item => `
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                            <span style="color: var(--text-main); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">
                                ${item.product ? item.product.title : 'Product'} <span style="color: var(--text-muted); font-size: 0.8rem;">x${item.quantity}</span>
                            </span>
                            <span>₹${item.product ? (item.product.price * item.quantity) : 0}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="summary-row" style="border-top: 1px solid var(--border-color); padding-top: 0.8rem;">
                    <span>Items Subtotal</span>
                    <span>₹${itemsPrice}</span>
                </div>
                <div class="summary-row">
                    <span>Tax Price (10%)</span>
                    <span>₹${taxPrice}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping</span>
                    <span>${shippingPrice === 0 ? 'Free' : `₹${shippingPrice}`}</span>
                </div>
                <div class="summary-row total">
                    <span>Total Amount</span>
                    <span>₹${totalPrice}</span>
                </div>
            </div>
        </div>
    `;

    // Hook listeners
    document.getElementById('checkout-back-btn').addEventListener('click', () => {
        isCheckoutMode = false;
        displayCartUI(container);
    });

    document.getElementById('checkout-shipping-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const addressLine = document.getElementById('ship-address').value.trim();
        const city = document.getElementById('ship-city').value.trim();
        const stateVal = document.getElementById('ship-state').value.trim();
        const country = document.getElementById('ship-country').value.trim();
        const postalCode = document.getElementById('ship-postal').value.trim();
        const phoneNumber = document.getElementById('ship-phone').value.trim();
        const paymentMethod = document.getElementById('checkout-payment-method').value;

        // Construct the order database payload based on orderSchema structure
        const orderItems = state.cart.items.map(item => ({
            product: item.product._id,
            title: item.product.title,
            image: (item.product.images && item.product.images.length > 0) ? item.product.images[0].url : '',
            price: item.product.price,
            quantity: item.quantity
        }));

        const shippingAddress = {
            country,
            city,
            state: stateVal,
            postalCode,
            addressLine,
            phoneNumber
        };

        const orderData = {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo: {
                id: 'MOCK_PAY_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                status: paymentMethod === 'COD' ? 'Pending' : 'Succeeded'
            }
        };

        try {
            // Send order data to backend
            const res = await api.orders.create(orderData);
            if (res) {
                // Clear cart server-side and update state
                await api.cart.clear();
                setCart(null);
                
                toast.success('Order placed successfully!');
                
                // Redirect user to My Orders view page
                window.location.hash = '#/orders';
            }
        } catch (err) {
            toast.error(err.message || 'Failed to place order. Please try again.');
        }
    });
}
