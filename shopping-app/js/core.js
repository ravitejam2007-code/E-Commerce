/**
 * ARPMart Central State Manager
 * Handles Cart, User Session, and Theme.
 */
window.ARPMart = (function () {
    const STORAGE_KEY = 'arpmart_global_state';

    // Initial state
    let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        cart: [],
        currentUser: null,
        theme: 'light'
    };

    // Pub/Sub pattern for reactive UI
    const subscribers = [];

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        notify();
    }

    function notify() {
        subscribers.forEach(callback => callback(state));
    }

    return {
        // State Access
        getState: () => state,

        // Cart Actions
        addToCart: (productOrId, qty = 1) => {
            // Accept either a product object or a product ID string
            let product = productOrId;
            if (typeof productOrId === 'string') {
                product = window.GLOBAL_CATALOG?.find(p => p.id === productOrId);
                if (!product) {
                    console.warn(`[ARPMart] Product not found: ${productOrId}`);
                    return null;
                }
            }
            const existing = state.cart.find(item => item.id === product.id);
            if (existing) {
                existing.qty += qty;
            } else {
                state.cart.push({ ...product, qty });
            }
            save();
            console.log(`[ARPMart] Added ${product.name} to cart.`);
            return product;
        },

        removeFromCart: (productId) => {
            state.cart = state.cart.filter(item => item.id !== productId);
            save();
            console.log(`[ARPMart] Removed ${productId} from cart.`);
        },

        updateQty: (productId, qty) => {
            const item = state.cart.find(item => item.id === productId);
            if (item) {
                item.qty = Math.max(1, qty);
                save();
            }
        },

        getCartTotal: () => {
            return state.cart.reduce((total, item) => total + (item.price * item.qty), 0);
        },

        getCartCount: () => {
            return state.cart.reduce((count, item) => count + item.qty, 0);
        },

        clearCart: () => {
            state.cart = [];
            save();
        },

        // Auth Actions
        login: (email, name) => {
            // Simulated login
            state.currentUser = { email, name, avatar: `https://ui-avatars.com/api/?name=${name}` };
            save();
            console.log(`[ARPMart] Welcome, ${name}!`);
        },

        logout: () => {
            state.currentUser = null;
            save();
            console.log(`[ARPMart] Logged out.`);
        },

        // Theme Actions
        toggleTheme: () => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            save();
        },

        // Subscription for UI updates
        subscribe: (callback) => {
            subscribers.push(callback);
            // Initial call to sync current UI
            callback(state);
        }
    };
})();
