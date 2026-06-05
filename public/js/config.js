// Application Configuration Constants

export const API_BASE_URL = '/api/v1';

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'my_cart_access_token',
    REFRESH_TOKEN: 'my_cart_refresh_token',
    USER_INFO: 'my_cart_user_info'
};

export const PRODUCT_CATEGORIES = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Kitchen',
    'Beauty & Personal Care',
    'Sports & Outdoors',
    'Toys & Games'
];

export const PAYMENT_METHODS = [
    { id: 'COD', name: 'Cash on Delivery (COD)' },
    { id: 'CARD', name: 'Credit or Debit Card' },
    { id: 'UPI', name: 'Unified Payments Interface (UPI)' }
];
