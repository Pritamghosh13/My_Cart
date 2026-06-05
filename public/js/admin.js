// Admin Dashboard & Catalog Management Controller
import { api } from './api.js';
import { state } from './state.js';
import { toast } from './utils/toast.js';
import { PRODUCT_CATEGORIES } from './config.js';

let activeEditProductId = null;

/**
 * Render the Admin Product Management Dashboard
 * @param {HTMLElement} container 
 */
export async function renderAdminDashboard(container) {
    container.innerHTML = `
        <div class="admin-header">
            <div>
                <h2 style="font-size: 2rem; font-family: 'Outfit';">Admin Management</h2>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Create, update, and manage your e-commerce catalog items.</p>
            </div>
            <button class="btn btn-primary" id="add-product-btn">
                <i class="fa-solid fa-plus"></i> Add New Product
            </button>
        </div>

        <div class="admin-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th style="width: 80px;">Image</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th style="width: 120px; text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody id="admin-product-rows">
                    <!-- Skeletons -->
                    ${Array(4).fill().map(() => `
                        <tr>
                            <td><div class="skeleton" style="width: 50px; height: 50px; border-radius: var(--radius-sm);"></div></td>
                            <td><div class="skeleton" style="height: 18px; width: 60%;"></div></td>
                            <td><div class="skeleton" style="height: 18px; width: 40%;"></div></td>
                            <td><div class="skeleton" style="height: 18px; width: 30%;"></div></td>
                            <td><div class="skeleton" style="height: 18px; width: 20%;"></div></td>
                            <td>
                                <div style="display: flex; gap: 8px; justify-content: center;">
                                    <div class="skeleton" style="width: 32px; height: 32px; border-radius: var(--radius-sm);"></div>
                                    <div class="skeleton" style="width: 32px; height: 32px; border-radius: var(--radius-sm);"></div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Add/Edit Modal Overlay -->
        <div id="product-modal" class="modal hidden">
            <div class="modal-content">
                <i class="fa-solid fa-xmark modal-close" id="modal-close-btn"></i>
                <h3 id="modal-title" style="font-size: 1.5rem; font-family: 'Outfit'; margin-bottom: 1.5rem;">Add Product</h3>
                
                <form id="product-form" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="prod-title">Product Title</label>
                        <input type="text" id="prod-title" class="form-control" placeholder="Enter product name" required>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="prod-category">Category</label>
                            <select id="prod-category" class="filter-select" style="width: 100%;" required>
                                <option value="">Select Category</option>
                                ${PRODUCT_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="prod-brand">Brand</label>
                            <input type="text" id="prod-brand" class="form-control" placeholder="Enter brand name">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="prod-price">Price (₹)</label>
                            <input type="number" id="prod-price" class="form-control" min="0" placeholder="0" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="prod-stock">Initial Stock</label>
                            <input type="number" id="prod-stock" class="form-control" min="0" placeholder="0" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="prod-desc">Description</label>
                        <textarea id="prod-desc" class="form-control" rows="4" placeholder="Enter detailed product features..." required style="resize: none;"></textarea>
                    </div>

                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label for="prod-images">Upload Product Images (Max 5)</label>
                        <input type="file" id="prod-images" class="form-control" accept="image/*" multiple>
                        <small style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.3rem; display: block;">
                            Adding new photos replaces any existing photos of this item.
                        </small>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        Save Product
                    </button>
                </form>
            </div>
        </div>
    `;

    setupAdminListeners(container);
    await fetchAndRenderAdminTable();
}

/**
 * Fetch catalog items and render row list
 */
async function fetchAndRenderAdminTable() {
    const rowsContainer = document.getElementById('admin-product-rows');
    if (!rowsContainer) return;

    try {
        // Fetch products (fetch large limit for management, e.g. 50 items)
        const res = await api.products.getAll(1, 50);
        if (res && res.data && res.data.products) {
            const products = res.data.products;

            if (products.length === 0) {
                rowsContainer.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 3rem;">
                            <div style="color: var(--text-muted); font-size: 0.95rem;">
                                No products found in the catalog. Click "Add New Product" to create one.
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            rowsContainer.innerHTML = products.map(product => {
                const mainImg = (product.images && product.images.length > 0) ? product.images[0].url : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
                
                return `
                    <tr data-id="${product._id}">
                        <td>
                            <div class="admin-table-img-wrapper">
                                <img src="${mainImg}" alt="${product.title}" class="admin-table-img" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'">
                            </div>
                        </td>
                        <td style="font-weight: 500; color: var(--text-main); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${product.title}
                        </td>
                        <td><span style="background: rgba(255,255,255,0.05); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.85rem;">${product.category}</span></td>
                        <td style="font-family: 'Outfit'; font-weight: 600;">₹${product.price}</td>
                        <td>${product.stock} items</td>
                        <td>
                            <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                <button class="action-icon-btn edit-btn" data-id="${product._id}" title="Edit product">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button class="action-icon-btn delete-btn" data-id="${product._id}" title="Delete product">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Bind actions
            setupRowActions(products);
        }
    } catch (err) {
        rowsContainer.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--error);">
                    Failed to fetch product list. Error: ${err.message || 'Unknown network error'}
                </td>
            </tr>
        `;
    }
}

function setupRowActions(products) {
    // Edit action click
    document.querySelectorAll('.action-icon-btn.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const product = products.find(p => p._id === id);
            if (!product) return;

            activeEditProductId = id;
            
            // Set details into modal form fields
            document.getElementById('modal-title').textContent = 'Update Product Details';
            document.getElementById('prod-title').value = product.title;
            document.getElementById('prod-category').value = product.category;
            document.getElementById('prod-brand').value = product.brand || '';
            document.getElementById('prod-price').value = product.price;
            document.getElementById('prod-stock').value = product.stock;
            document.getElementById('prod-desc').value = product.description;
            
            // Clear image input
            document.getElementById('prod-images').value = '';

            // Open Modal
            document.getElementById('product-modal').classList.remove('hidden');
        });
    });

    // Delete action click
    document.querySelectorAll('.action-icon-btn.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const confirmDel = confirm('Are you sure you want to delete this product from the catalog? This will delete all its images and cannot be undone.');
            
            if (confirmDel) {
                try {
                    const res = await api.products.delete(id);
                    if (res) {
                        toast.success('Product deleted successfully.');
                        await fetchAndRenderAdminTable();
                    }
                } catch (err) {
                    toast.error(err.message || 'Failed to delete product. Access denied.');
                }
            }
        });
    });
}

function setupAdminListeners(container) {
    const modal = document.getElementById('product-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const addBtn = document.getElementById('add-product-btn');
    const form = document.getElementById('product-form');

    // Open Modal for Add
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            activeEditProductId = null;
            document.getElementById('modal-title').textContent = 'Add Catalog Product';
            form.reset();
            modal.classList.remove('hidden');
        });
    }

    // Close Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // Close modal on click outside content
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    // Form Submit (Handles both Create and Update)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('prod-title').value.trim();
            const category = document.getElementById('prod-category').value;
            const brand = document.getElementById('prod-brand').value.trim();
            const price = document.getElementById('prod-price').value;
            const stock = document.getElementById('prod-stock').value;
            const description = document.getElementById('prod-desc').value.trim();
            const files = document.getElementById('prod-images').files;

            if (!title || !category || price == null || stock == null || !description) {
                toast.error('Please fill in all required inputs.');
                return;
            }

            if (files.length > 5) {
                toast.error('You can upload a maximum of 5 images.');
                return;
            }

            // Create FormData to send images and files to multer backend
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('brand', brand);
            formData.append('price', price);
            formData.append('stock', stock);
            formData.append('description', description);

            for (let i = 0; i < files.length; i++) {
                formData.append('images', files[i]);
            }

            try {
                if (activeEditProductId) {
                    // Update
                    const res = await api.products.update(activeEditProductId, formData);
                    if (res) {
                        toast.success('Product updated successfully!');
                        modal.classList.add('hidden');
                        await fetchAndRenderAdminTable();
                    }
                } else {
                    // Create
                    const res = await api.products.create(formData);
                    if (res) {
                        toast.success('Product created successfully!');
                        modal.classList.add('hidden');
                        await fetchAndRenderAdminTable();
                    }
                }
            } catch (err) {
                toast.error(err.message || 'Operation failed. Please ensure you are authorized.');
            }
        });
    }
}
