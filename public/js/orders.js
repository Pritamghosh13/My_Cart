// Order List & Details Views Controller
import { api } from './api.js';
import { toast } from './utils/toast.js';

/**
 * Render list of orders placed by the user
 * @param {HTMLElement} container 
 */
export async function renderOrdersList(container) {
    container.innerHTML = `
        <h2 style="font-size: 2rem; font-family: 'Outfit'; margin-bottom: 1.5rem;">My Orders</h2>
        <div class="orders-list" id="orders-list-wrapper">
            ${Array(3).fill().map(() => `
                <div class="order-row-card">
                    <div style="display: flex; flex-direction: column; gap: 8px; width: 60%;">
                        <div class="skeleton" style="height: 20px; width: 40%;"></div>
                        <div class="skeleton" style="height: 16px; width: 80%;"></div>
                    </div>
                    <div class="skeleton" style="height: 35px; width: 100px;"></div>
                </div>
            `).join('')}
        </div>
    `;

    try {
        const res = await api.orders.getMyOrders();
        const listWrapper = document.getElementById('orders-list-wrapper');
        if (!listWrapper) return;

        if (!res || !res.data || res.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-receipt empty-state-icon"></i>
                    <h3>No Orders Placed Yet</h3>
                    <p>It looks like you haven't placed any orders yet. Start shopping and checking out items!</p>
                    <a href="#/" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
            return;
        }

        listWrapper.innerHTML = res.data.map(order => {
            const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            const statusClass = `status-${order.orderStatus.toLowerCase().replace(/ /g, '-')}`;
            
            return `
                <div class="order-row-card" data-id="${order._id}" style="cursor: pointer;">
                    <div class="order-meta-info">
                        <span class="order-id-label">Order ID: #${order._id.substring(order._id.length - 8).toUpperCase()}</span>
                        <span class="order-date" style="font-size: 0.85rem; color: var(--text-muted);">Placed on ${dateStr}</span>
                        <span style="font-size: 0.9rem; color: var(--text-main); font-weight: 500;">
                            ${order.orderItems.length} item(s) &bull; Total: ₹${order.totalPrice}
                        </span>
                    </div>

                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="order-status-badge ${statusClass}">${order.orderStatus}</span>
                        <i class="fa-solid fa-chevron-right" style="color: var(--text-muted);"></i>
                    </div>
                </div>
            `;
        }).join('');

        // Add detail route triggers
        listWrapper.querySelectorAll('.order-row-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                window.location.hash = `#/orders/${id}`;
            });
        });

    } catch (err) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation empty-state-icon" style="color: var(--error);"></i>
                <h3>Error Fetching Orders</h3>
                <p>${err.message || 'We could not fetch your orders. Please check backend connection.'}</p>
                <button class="btn btn-secondary" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}

/**
 * Render single order detail sheet
 * @param {HTMLElement} container 
 * @param {string} orderId 
 */
export async function renderOrderDetails(container, orderId) {
    container.innerHTML = `
        <h2 style="font-size: 2rem; font-family: 'Outfit'; margin-bottom: 1.5rem;">Order Details</h2>
        <div class="order-details-container">
            <div class="skeleton order-details-card" style="height: 350px;"></div>
            <div class="skeleton summary-card" style="height: 250px;"></div>
        </div>
    `;

    try {
        const res = await api.orders.getSingle(orderId);
        if (res && res.data) {
            const order = res.data;
            const dateStr = new Date(order.createdAt).toLocaleString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const statusClass = `status-${order.orderStatus.toLowerCase().replace(/ /g, '-')}`;
            
            // Render details layouts
            container.innerHTML = `
                <div style="margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
                    <a href="#/orders" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        <i class="fa-solid fa-chevron-left"></i> Back to Orders
                    </a>
                    <span class="order-status-badge ${statusClass}" style="font-size: 0.95rem; padding: 0.4rem 1rem;">
                        Status: ${order.orderStatus}
                    </span>
                </div>

                <div class="order-details-container">
                    <div class="order-details-card">
                        <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                            <h3 style="font-family: 'Outfit'; font-size: 1.3rem;">Invoice: #${order._id.toUpperCase()}</h3>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">Created: ${dateStr}</span>
                        </div>

                        <!-- Invoice Products -->
                        <div>
                            <h4 style="margin-bottom: 1rem; font-family: 'Outfit'; font-size: 1rem;">Order Items</h4>
                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                ${order.orderItems.map(item => {
                                    const imgUrl = item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
                                    return `
                                        <div style="display: flex; align-items: center; gap: 1rem; background: rgba(255, 255, 255, 0.02); padding: 0.8rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                                            <div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: rgba(255,255,255,0.01);">
                                                <img src="${imgUrl}" alt="${item.title}" style="max-width: 100%; max-height: 100%; object-fit: cover;">
                                            </div>
                                            <div style="flex-grow: 1;">
                                                <span style="font-weight: 500; font-size: 0.95rem;">${item.title}</span>
                                                <div style="font-size: 0.85rem; color: var(--text-muted);">₹${item.price} &times; ${item.quantity}</div>
                                            </div>
                                            <span style="font-weight: 700; font-family: 'Outfit';">₹${item.price * item.quantity}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Shipping Address Details -->
                        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                            <h4 style="margin-bottom: 0.5rem; font-family: 'Outfit'; font-size: 1rem;">Shipping Address</h4>
                            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5;">
                                ${order.shippingAddress.addressLine}<br>
                                ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
                                ${order.shippingAddress.country} - ${order.shippingAddress.postalCode}<br>
                                <span style="color: var(--text-main); font-weight: 500;">Phone: ${order.shippingAddress.phoneNumber}</span>
                            </p>
                        </div>
                    </div>

                    <!-- Side Order Summary Billing Card -->
                    <div class="summary-card">
                        <h3 class="summary-title">Billing Summary</h3>
                        
                        <div class="summary-row">
                            <span>Payment Method</span>
                            <span style="color: var(--text-main); font-weight: 600;">${order.paymentMethod}</span>
                        </div>
                        <div class="summary-row" style="margin-bottom: 0.8rem;">
                            <span>Payment ID</span>
                            <span style="font-size: 0.8rem; font-family: monospace;">${order.paymentInfo ? order.paymentInfo.id : 'N/A'}</span>
                        </div>

                        <div class="summary-row" style="border-top: 1px solid var(--border-color); padding-top: 0.8rem;">
                            <span>Items Subtotal</span>
                            <span>₹${order.itemsPrice}</span>
                        </div>
                        <div class="summary-row">
                            <span>Tax (10%)</span>
                            <span>₹${order.taxPrice}</span>
                        </div>
                        <div class="summary-row">
                            <span>Shipping</span>
                            <span>₹${order.shippingPrice}</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total Billed</span>
                            <span>₹${order.totalPrice}</span>
                        </div>

                        <!-- Cancel Button (Only if status is Processing) -->
                        ${order.orderStatus === 'Processing' ? `
                            <button class="btn btn-danger" id="cancel-order-btn" style="width: 100%; margin-top: 1rem;">
                                <i class="fa-solid fa-ban"></i> Cancel Order
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            // Setup cancel click handler
            const cancelBtn = document.getElementById('cancel-order-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                        try {
                            const cancelRes = await api.orders.cancel(orderId);
                            if (cancelRes) {
                                toast.success('Order cancelled successfully.');
                                // Re-render the details page to reflect Cancelled status
                                renderOrderDetails(container, orderId);
                            }
                        } catch (err) {
                            toast.error(err.message || 'Failed to cancel order.');
                        }
                    }
                });
            }
        }
    } catch (e) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation empty-state-icon" style="color: var(--error);"></i>
                <h3>Error Fetching Order Details</h3>
                <p>${e.message || 'We could not fetch this order receipt.'}</p>
                <a href="#/orders" class="btn btn-secondary">Back to Orders</a>
            </div>
        `;
    }
}
