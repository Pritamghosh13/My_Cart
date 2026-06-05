// Product Catalog & Detail Views Controller
import { api } from './api.js';
import { state, setProductsData } from './state.js';
import { toast } from './utils/toast.js';
import { PRODUCT_CATEGORIES } from './config.js';

let activeSearchQuery = '';
let activeCategory = '';
let activeSort = '';

/**
 * Render the product catalog view
 * @param {HTMLElement} container 
 */
export async function renderProductsList(container) {
    // 1. Render core grid structure with skeleton loaders
    container.innerHTML = `
        <div class="products-layout">
            <div class="catalog-header">
                <div class="search-bar">
                    <i class="fa-solid fa-magnifying-glass" style="color: var(--text-muted);"></i>
                    <input type="text" id="catalog-search" placeholder="Search premium items..." value="${activeSearchQuery}">
                </div>
                
                <div class="catalog-filters">
                    <select id="filter-category" class="filter-select">
                        <option value="">All Categories</option>
                        ${PRODUCT_CATEGORIES.map(cat => `<option value="${cat}" ${activeCategory === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                    </select>

                    <select id="sort-price" class="filter-select">
                        <option value="">Sort By</option>
                        <option value="asc" ${activeSort === 'asc' ? 'selected' : ''}>Price: Low to High</option>
                        <option value="desc" ${activeSort === 'desc' ? 'selected' : ''}>Price: High to Low</option>
                    </select>
                </div>
            </div>

            <!-- Skeleton Loader Grid -->
            <div class="product-grid" id="catalog-grid">
                ${Array(6).fill().map(() => `
                    <div class="product-card">
                        <div class="skeleton skeleton-img"></div>
                        <div class="product-card-content" style="gap: 12px;">
                            <div class="skeleton skeleton-text" style="width: 30%;"></div>
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-text" style="width: 90%;"></div>
                            <div class="product-card-footer" style="margin-top: 15px; width: 100%;">
                                <div class="skeleton skeleton-price" style="width: 40%;"></div>
                                <div class="skeleton skeleton-btn" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="pagination hidden" id="catalog-pagination"></div>
        </div>
    `;

    // Setup input listeners right away
    setupCatalogListeners(container);

    // 2. Fetch and render actual products
    await fetchAndRenderProducts(container);
}

/**
 * Fetch products and update catalog view
 */
async function fetchAndRenderProducts(container) {
    const grid = document.getElementById('catalog-grid');
    const pagination = document.getElementById('catalog-pagination');
    if (!grid) return;

    try {
        // Fetch all products (handles standard backend limit/page counts)
        // Set limit larger (e.g. 12) or 6 to match user interfaces
        const res = await api.products.getAll(state.currentPage, 6);
        if (res && res.data) {
            setProductsData(res.data);
            
            let filteredProducts = [...state.products];
            
            // Client-side category, search, and sorting integration
            if (activeCategory) {
                filteredProducts = filteredProducts.filter(p => p.category === activeCategory);
            }
            if (activeSearchQuery) {
                const query = activeSearchQuery.toLowerCase();
                filteredProducts = filteredProducts.filter(p => 
                    p.title.toLowerCase().includes(query) || 
                    p.description.toLowerCase().includes(query) ||
                    (p.brand && p.brand.toLowerCase().includes(query))
                );
            }
            if (activeSort === 'asc') {
                filteredProducts.sort((a, b) => a.price - b.price);
            } else if (activeSort === 'desc') {
                filteredProducts.sort((a, b) => b.price - a.price);
            }

            // Render products
            if (filteredProducts.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1;">
                        <div class="empty-state">
                            <i class="fa-solid fa-basket-shopping empty-state-icon"></i>
                            <h3>No Products Found</h3>
                            <p>We couldn't find any items matching your search criteria.</p>
                            <button class="btn btn-primary" id="clear-filters-btn">Clear All Filters</button>
                        </div>
                    </div>
                `;
                pagination.classList.add('hidden');
                
                const clearBtn = document.getElementById('clear-filters-btn');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        activeSearchQuery = '';
                        activeCategory = '';
                        activeSort = '';
                        state.currentPage = 1;
                        renderProductsList(container);
                    });
                }
            } else {
                grid.innerHTML = filteredProducts.map(product => {
                    const mainImg = (product.images && product.images.length > 0) ? product.images[0].url : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';
                    return `
                        <div class="product-card" data-id="${product._id}">
                            <div class="product-card-img-wrapper" style="cursor: pointer;">
                                <img src="${mainImg}" alt="${product.title}" class="product-card-img" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'">
                            </div>
                            <div class="product-card-content">
                                <span class="product-card-brand">${product.brand || 'Premium Brand'}</span>
                                <h3 class="product-card-title" style="cursor: pointer;">${product.title}</h3>
                                <p class="product-card-desc" style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                    ${product.description}
                                </p>
                                <div class="product-card-footer">
                                    <span class="product-card-price">₹${product.price}</span>
                                    <button class="btn btn-primary add-to-cart-btn" style="padding: 0.5rem 1rem; border-radius: 50%; font-size: 1rem; width: 40px; height: 40px;" data-id="${product._id}">
                                        <i class="fa-solid fa-cart-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                // Render pagination footer
                if (state.totalPages > 1) {
                    pagination.innerHTML = `
                        <button class="btn btn-secondary ${state.currentPage === 1 ? 'disabled' : ''}" id="prev-page-btn">
                            <i class="fa-solid fa-chevron-left"></i> Previous
                        </button>
                        <span class="page-info">Page ${state.currentPage} of ${state.totalPages}</span>
                        <button class="btn btn-secondary ${state.currentPage === state.totalPages ? 'disabled' : ''}" id="next-page-btn">
                            Next <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    `;
                    pagination.classList.remove('hidden');

                    document.getElementById('prev-page-btn').addEventListener('click', () => {
                        if (state.currentPage > 1) {
                            state.currentPage--;
                            fetchAndRenderProducts(container);
                        }
                    });

                    document.getElementById('next-page-btn').addEventListener('click', () => {
                        if (state.currentPage < state.totalPages) {
                            state.currentPage++;
                            fetchAndRenderProducts(container);
                        }
                    });
                } else {
                    pagination.classList.add('hidden');
                }
            }

            // Click navigations to Product Details
            grid.querySelectorAll('.product-card-img-wrapper, .product-card-title').forEach(el => {
                el.addEventListener('click', (e) => {
                    const card = e.target.closest('.product-card');
                    const id = card.getAttribute('data-id');
                    window.location.hash = `#/product/${id}`;
                });
            });

            // Quick add to cart
            grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const productId = btn.getAttribute('data-id');
                    if (!state.user) {
                        toast.info('Please log in to add items to cart.');
                        window.location.hash = '#/login';
                        return;
                    }
                    try {
                        const cartRes = await api.cart.add(productId, 1);
                        if (cartRes && cartRes.data) {
                            import('./state.js').then(m => m.setCart(cartRes.data));
                            toast.success('Added to cart!');
                        }
                    } catch (err) {
                        toast.error(err.message || 'Failed to add item to cart.');
                    }
                });
            });
        }
    } catch (error) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1;">
                <div class="empty-state">
                    <i class="fa-solid fa-circle-exclamation empty-state-icon" style="color: var(--error);"></i>
                    <h3>Error Loading Products</h3>
                    <p>${error.message || 'We could not fetch items right now.'}</p>
                    <button class="btn btn-secondary" onclick="window.location.reload()">Retry</button>
                </div>
            </div>
        `;
        pagination.classList.add('hidden');
    }
}

function setupCatalogListeners(container) {
    const search = document.getElementById('catalog-search');
    const category = document.getElementById('filter-category');
    const sort = document.getElementById('sort-price');

    if (search) {
        let timer;
        search.addEventListener('input', (e) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                activeSearchQuery = e.target.value.trim();
                state.currentPage = 1;
                fetchAndRenderProducts(container);
            }, 300);
        });
    }

    if (category) {
        category.addEventListener('change', (e) => {
            activeCategory = e.target.value;
            state.currentPage = 1;
            fetchAndRenderProducts(container);
        });
    }

    if (sort) {
        sort.addEventListener('change', (e) => {
            activeSort = e.target.value;
            fetchAndRenderProducts(container);
        });
    }
}

/**
 * Render details of a single product
 * @param {HTMLElement} container 
 * @param {string} productId 
 */
export async function renderProductDetails(container, productId) {
    // 1. Skeleton UI
    container.innerHTML = `
        <div class="product-details">
            <div class="details-gallery">
                <div class="skeleton main-image-wrapper"></div>
                <div style="display: flex; gap: 10px;">
                    <div class="skeleton" style="width: 80px; height: 80px;"></div>
                    <div class="skeleton" style="width: 80px; height: 80px;"></div>
                    <div class="skeleton" style="width: 80px; height: 80px;"></div>
                </div>
            </div>
            
            <div class="details-info" style="gap: 15px;">
                <div class="skeleton skeleton-text" style="width: 25%;"></div>
                <div class="skeleton skeleton-title" style="height: 40px; width: 80%;"></div>
                <div class="skeleton skeleton-text" style="width: 30%;"></div>
                <div class="skeleton skeleton-title" style="width: 40%;"></div>
                <div class="skeleton skeleton-text" style="width: 95%; height: 80px;"></div>
                <div style="display: flex; gap: 15px; margin-top: 15px;">
                    <div class="skeleton" style="width: 120px; height: 45px;"></div>
                    <div class="skeleton" style="width: 180px; height: 45px;"></div>
                </div>
            </div>
        </div>
    `;

    try {
        // 2. Fetch data
        const res = await api.products.getSingle(productId);
        if (res && res.data) {
            const product = res.data;
            const imagesList = product.images && product.images.length > 0 
                ? product.images.map(img => img.url) 
                : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'];
            
            const isInStock = product.stock > 0;

            container.innerHTML = `
                <div class="product-details">
                    <!-- Image Gallery -->
                    <div class="details-gallery">
                        <div class="main-image-wrapper">
                            <img src="${imagesList[0]}" alt="${product.title}" class="main-image" id="details-main-img" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'">
                        </div>
                        
                        <div class="thumbnail-list">
                            ${imagesList.map((url, index) => `
                                <div class="thumbnail-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                                    <img src="${url}" class="thumbnail-img" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'">
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Details Description Info -->
                    <div class="details-info">
                        <span class="details-brand">${product.brand || 'Premium Brand'}</span>
                        <h2 class="details-title">${product.title}</h2>
                        
                        <!-- Ratings -->
                        <div class="details-rating">
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star-half-stroke"></i>
                            <span class="rating-count">4.5 (24 reviews)</span>
                        </div>

                        <span class="details-price">₹${product.price}</span>
                        
                        <div>
                            <span class="details-stock-badge ${isInStock ? 'stock-in' : 'stock-out'}">
                                <i class="fa-solid ${isInStock ? 'fa-check' : 'fa-xmark'}"></i>
                                ${isInStock ? `${product.stock} items in stock` : 'Out of Stock'}
                            </span>
                        </div>

                        <p class="details-desc" style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">
                            ${product.description}
                        </p>

                        <div class="details-actions">
                            <div class="quantity-selector">
                                <button class="quantity-btn" id="qty-minus" ${!isInStock ? 'disabled' : ''}>-</button>
                                <span class="quantity-input" id="qty-input">1</span>
                                <button class="quantity-btn" id="qty-plus" ${!isInStock ? 'disabled' : ''}>+</button>
                            </div>

                            <button class="btn btn-primary ${!isInStock ? 'disabled' : ''}" id="details-add-to-cart-btn" style="flex-grow: 1;">
                                <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                            </button>
                        </div>
                    </div>

                    <!-- Future-Proof Rating/Review Section -->
                    <div class="reviews-section">
                        <h3 style="font-size: 1.5rem; font-family: 'Outfit';">Customer Reviews</h3>
                        <div class="reviews-layout">
                            <!-- Submit Review Form -->
                            <div class="review-form-card">
                                <h4 style="margin-bottom: 1rem; font-size: 1.1rem; font-family: 'Outfit';">Submit your review</h4>
                                <form id="review-submission-form">
                                    <div class="form-group">
                                        <label>Rating</label>
                                        <div class="star-rating-input" id="star-rating-input">
                                            <i class="fa-solid fa-star active" data-rating="1"></i>
                                            <i class="fa-solid fa-star active" data-rating="2"></i>
                                            <i class="fa-solid fa-star active" data-rating="3"></i>
                                            <i class="fa-solid fa-star active" data-rating="4"></i>
                                            <i class="fa-solid fa-star" data-rating="5"></i>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="review-comment">Comment</label>
                                        <textarea id="review-comment" class="form-control" rows="4" placeholder="Write your feedback..." required style="resize: none;"></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-secondary" style="width: 100%;">
                                        Submit Feedback
                                    </button>
                                </form>
                            </div>

                            <!-- List of dummy/existing reviews -->
                            <div class="review-list">
                                <div class="review-card">
                                    <div class="review-header">
                                        <span class="reviewer-name">Alex Johnson</span>
                                        <span class="review-date">May 20, 2026</span>
                                    </div>
                                    <div class="details-rating" style="margin-bottom: 0.5rem; font-size: 0.85rem;">
                                        <i class="fa-solid fa-star"></i>
                                        <i class="fa-solid fa-star"></i>
                                        <i class="fa-solid fa-star"></i>
                                        <i class="fa-solid fa-star"></i>
                                        <i class="fa-solid fa-star"></i>
                                    </div>
                                    <p style="color: var(--text-muted); font-size: 0.9rem;">
                                        Absolutely amazing quality. The product exceeded my expectations. Shipping was fast too!
                                    </p>
                                </div>

                                <div class="review-card">
                                    <div class="review-header">
                                        <span class="reviewer-name">Sarah Connor</span>
                                        <span class="review-date">April 12, 2026</span>
                                    </div>
                                    <div class="details-rating" style="margin-bottom: 0.5rem; font-size: 0.85rem;">
                                        <i class="fa-solid fa-star"></i>
                                        <i class="fa-solid fa-star"></i>
                                        <i class="fa-solid fa-star"></i>
                                        <i class="fa-solid fa-star"></i>
                                        <i class="fa-regular fa-star" style="color: var(--text-muted);"></i>
                                    </div>
                                    <p style="color: var(--text-muted); font-size: 0.9rem;">
                                        Decent item, works well. The materials are sturdy but the size is slightly larger than expected.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Image Gallery Clicks
            const thumbnails = container.querySelectorAll('.thumbnail-item');
            const mainImgEl = document.getElementById('details-main-img');
            
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    thumbnails.forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    const idx = thumb.getAttribute('data-index');
                    mainImgEl.src = imagesList[idx];
                });
            });

            // Quantity adjusters
            const qtyInput = document.getElementById('qty-input');
            let quantity = 1;
            
            document.getElementById('qty-minus').addEventListener('click', () => {
                if (quantity > 1) {
                    quantity--;
                    qtyInput.textContent = quantity;
                }
            });
            document.getElementById('qty-plus').addEventListener('click', () => {
                if (quantity < product.stock) {
                    quantity++;
                    qtyInput.textContent = quantity;
                } else {
                    toast.info('Cannot exceed available stock.');
                }
            });

            // Add to cart click
            document.getElementById('details-add-to-cart-btn').addEventListener('click', async () => {
                if (!state.user) {
                    toast.info('Please log in to add items to cart.');
                    window.location.hash = '#/login';
                    return;
                }

                try {
                    const cartRes = await api.cart.add(productId, quantity);
                    if (cartRes && cartRes.data) {
                        import('./state.js').then(m => m.setCart(cartRes.data));
                        toast.success('Successfully added to your cart!');
                    }
                } catch (e) {
                    toast.error(e.message || 'Failed to add item to cart.');
                }
            });

            // Star rating interface selector
            const stars = container.querySelectorAll('.star-rating-input i');
            let selectedRating = 4;
            stars.forEach(star => {
                star.addEventListener('click', () => {
                    const rating = parseInt(star.getAttribute('data-rating'));
                    selectedRating = rating;
                    stars.forEach(s => {
                        const r = parseInt(s.getAttribute('data-rating'));
                        if (r <= rating) {
                            s.className = 'fa-solid fa-star active';
                        } else {
                            s.className = 'fa-solid fa-star';
                        }
                    });
                });
            });

            // Submit Review form handler (planned inactive)
            document.getElementById('review-submission-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const comment = document.getElementById('review-comment').value;
                console.log('Submitted review rating:', selectedRating, 'Comment:', comment);
                
                toast.info('Feedback received! Ratings API is currently undergoing server upgrades.');
                document.getElementById('review-comment').value = '';
            });
        }
    } catch (e) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation empty-state-icon" style="color: var(--error);"></i>
                <h3>Error Loading Product Details</h3>
                <p>${e.message || 'We could not fetch product info at this time.'}</p>
                <a href="#/" class="btn btn-secondary">Back to Catalog</a>
            </div>
        `;
    }
}
