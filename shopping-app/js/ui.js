/**
 * ARPMart Shared UI Components
 * Centralized UI logic for Header, Cart, and Global Notifications.
 */

const ShopUI = {
    /**
     * Initialize shared UI components on any page
     */
    init() {
        this.renderHeader();
        this.renderCartModal();
        this.renderQuickViewModal();
        this.renderToastContainer();
        this.attachGlobalListeners();
        
        // Subscribe to state changes to update UI automatically
        ARPMart.subscribe(state => {
            this.updateHeader(state);
            this.updateCart(state);
        });

        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    /**
     * Renders the shared glassmorphism header
     */
    renderHeader() {
        const header = document.querySelector('header');
        if (!header) return;

        // Note: In a real production app, we would inject the HTML here.
        // For this refactor, we'll assume the header shell exists and we just hydrate it.
        this.updateHeader(ARPMart.getState());
    },

    /**
     * Updates header elements (Cart count, User status)
     */
    updateHeader(state) {
        const cartCountEl = document.getElementById('cartCount');
        const userSection = document.getElementById('user-section');

        if (cartCountEl) {
            cartCountEl.textContent = ARPMart.getCartCount();
        }

        if (userSection) {
            if (state.currentUser) {
                userSection.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-bold text-slate-500 hidden sm:inline">Hi, ${state.currentUser.name.split(' ')[0]}</span>
                        <button onclick="ARPMart.logout()" class="p-2 rounded-full hover:bg-slate-100 transition-colors" title="Logout">
                            <i data-lucide="log-out" class="w-5 h-5 text-slate-600"></i>
                        </button>
                    </div>
                `;
            } else {
                userSection.innerHTML = `
                    <button onclick="ShopUI.showLoginModal()" class="text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-0.5 hover:text-indigo-600 hover:border-indigo-600 transition-all">
                        Sign In
                    </button>
                `;
            }
            if (window.lucide) lucide.createIcons();
        }
    },

    /**
     * Renders the shared cart modal structure
     */
    renderCartModal() {
        if (document.getElementById('cartModal')) return;

        const modalHtml = `
            <div id="cartModal" class="fixed inset-0 z-[100] hidden overflow-hidden">
                <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="ShopUI.toggleCart()"></div>
                <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-full" id="cartSidebar">
                    <div class="p-6 border-b flex items-center justify-between bg-slate-50/50">
                        <div class="flex items-center gap-3">
                            <div class="bg-indigo-600 p-2 rounded-lg text-white">
                                <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                            </div>
                            <h3 class="text-xl font-bold text-slate-900">Your Bag</h3>
                        </div>
                        <button onclick="ShopUI.toggleCart()" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <i data-lucide="x" class="w-6 h-6 text-slate-500"></i>
                        </button>
                    </div>
                    
                    <div id="cartItemsList" class="flex-1 overflow-y-auto p-6 space-y-6">
                        <!-- Items injected here -->
                    </div>
                    
                    <div class="p-6 border-t bg-slate-50/50 space-y-4">
                        <div class="flex justify-between items-end">
                            <span class="text-slate-500 font-semibold uppercase text-[10px] tracking-[0.2em]">Subtotal</span>
                            <span id="cartSubtotal" class="text-3xl font-black text-slate-900 tracking-tighter">₹0</span>
                        </div>
                        <button onclick="ShopUI.handleCheckout()" class="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200">
                            Checkout Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) lucide.createIcons();
    },

    /**
     * Toggles the cart sidebar visibility
     */
    toggleCart() {
        const modal = document.getElementById('cartModal');
        const sidebar = document.getElementById('cartSidebar');
        if (!modal || !sidebar) return;

        const isHidden = modal.classList.contains('hidden');
        if (isHidden) {
            modal.classList.remove('hidden');
            setTimeout(() => sidebar.classList.remove('translate-x-full'), 10);
            this.updateCart(ARPMart.getState());
        } else {
            sidebar.classList.add('translate-x-full');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    },

    /**
     * Updates the cart modal content
     */
    updateCart(state) {
        const container = document.getElementById('cartItemsList');
        const subtotalEl = document.getElementById('cartSubtotal');
        if (!container) return;

        if (state.cart.length === 0) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div class="bg-slate-100 p-6 rounded-full">
                        <i data-lucide="ghost" class="w-12 h-12 text-slate-300"></i>
                    </div>
                    <p class="text-slate-400 font-bold uppercase text-xs tracking-widest">Your bag is empty</p>
                    <button onclick="ShopUI.toggleCart()" class="text-indigo-600 font-bold text-sm hover:underline">Start Shopping</button>
                </div>
            `;
            if (subtotalEl) subtotalEl.textContent = '₹0';
            if (window.lucide) lucide.createIcons();
            return;
        }

        container.innerHTML = state.cart.map(item => `
            <div class="flex gap-4 items-center group">
                <div class="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                </div>
                <div class="flex-1 space-y-1">
                    <div class="flex justify-between items-start">
                        <h5 class="font-bold text-sm text-slate-900 line-clamp-1">${item.name}</h5>
                        <button onclick="ARPMart.removeFromCart('${item.id}')" class="text-slate-300 hover:text-red-500 transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <p class="text-indigo-600 font-black text-sm">₹${item.price.toLocaleString('en-IN')}</p>
                    <div class="flex items-center gap-3 mt-2">
                        <div class="flex items-center border border-slate-200 rounded-lg bg-white">
                            <button onclick="ARPMart.updateQty('${item.id}', ${item.qty - 1})" class="p-1 px-2 hover:bg-slate-50 transition-colors">
                                <i data-lucide="minus" class="w-3 h-3 text-slate-500"></i>
                            </button>
                            <span class="text-xs font-bold w-6 text-center text-slate-700">${item.qty}</span>
                            <button onclick="ARPMart.updateQty('${item.id}', ${item.qty + 1})" class="p-1 px-2 hover:bg-slate-50 transition-colors">
                                <i data-lucide="plus" class="w-3 h-3 text-slate-500"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        if (subtotalEl) {
            subtotalEl.textContent = `₹${ARPMart.getCartTotal().toLocaleString('en-IN')}`;
        }
        if (window.lucide) lucide.createIcons();
    },

    /**
     * Renders global toast container
     */
    renderToastContainer() {
        if (document.getElementById('toast-container')) return;
        const container = `<div id="toast-container" class="fixed top-8 right-8 z-[200] space-y-4 pointer-events-none"></div>`;
        document.body.insertAdjacentHTML('beforeend', container);
    },

    /**
     * Shows a global toast notification
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const id = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${id}" class="bg-white border border-slate-100 shadow-2xl p-4 rounded-2xl flex items-center gap-4 transform transition-all translate-x-20 opacity-0 pointer-events-auto min-w-[300px]">
                <div class="${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} p-2 rounded-xl">
                    <i data-lucide="${type === 'success' ? 'check' : 'alert-circle'}" class="w-5 h-5"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-bold text-slate-900">${message}</p>
                </div>
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', toastHtml);
        const toast = document.getElementById(id);
        
        // Animation
        setTimeout(() => toast.classList.remove('translate-x-20', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('translate-x-20', 'opacity-0');
            setTimeout(() => toast.remove(), 500);
        }, 4000);

        if (window.lucide) lucide.createIcons();
    },

    /**
     * Mock login modal
     */
    showLoginModal() {
        // Redirect to the dedicated sign-in page
        window.location.href = 'signin.html';
    },

    /**
     * Handle checkout redirect or logic
     */
    handleCheckout() {
        const state = ARPMart.getState();
        if (state.cart.length === 0) {
            this.showToast("Your bag is empty!", "error");
            return;
        }
        if (!state.currentUser) {
            this.showToast("Please sign in to checkout", "error");
            this.showLoginModal();
            return;
        }
        
        // Redirect to a real checkout page
        window.location.href = 'checkout.html';
    },



    getCategoryPage(category) {
        if (!category) return 'index.html';
        const map = {
            'mobiles': 'mobiles-tech.html',
            'tablets': 'mobiles-tech.html',
            'fashion': 'fashion-shop.html',
            'furniture': 'furniwood.html',
            'electronics': 'tvs-appliance.html',
            'appliances': 'tvs-appliance.html',
            'grocery': 'grocery-shop.html',
            'home & kitchen': 'home_kitchen.html',
            'travel': 'flynow.html',
            'gym': 'gym-fitness.html',
            'healthcare': 'healthcare.html',
            'books': 'books-study.html',
            'jewelry': 'jewelry.html',
            'automotive': 'automotive.html',
            'pets': 'pet-supplies.html'
        };
        return map[category.toLowerCase()] || 'index.html';
    },

    handleSearchEnter(e, query) {
        if (e.key === 'Enter' && query.trim()) {
            const q = query.toLowerCase().trim();
            
            // Map common category search terms directly to category pages
            const categoryMap = {
                'mobiles': 'mobiles-tech.html',
                'mobile': 'mobiles-tech.html',
                'phone': 'mobiles-tech.html',
                'samsung': 'mobiles-tech.html',
                'apple': 'mobiles-tech.html',
                'electronics': 'tvs-appliance.html',
                'electronic': 'tvs-appliance.html',
                'fashion': 'fashion-shop.html',
                'clothes': 'fashion-shop.html',
                'clothing': 'fashion-shop.html',
                'grocery': 'grocery-shop.html',
                'groceries': 'grocery-shop.html',
                'furniture': 'furniwood.html',
                'travel': 'flynow.html',
                'kitchen': 'home_kitchen.html',
                'appliances': 'tvs-appliance.html',
                'gym': 'gym-fitness.html',
                'fitness': 'gym-fitness.html',
                'health': 'healthcare.html',
                'medicine': 'healthcare.html',
                'books': 'books-study.html',
                'jewelry': 'jewelry.html',
                'auto': 'automotive.html',
                'car': 'automotive.html',
                'pets': 'pet-supplies.html',
                'dog': 'pet-supplies.html',
                'cat': 'pet-supplies.html'
            };
            
            if (categoryMap[q]) {
                window.location.href = `${categoryMap[q]}?search=${encodeURIComponent(query)}`;
                return;
            }
            
            const results = window.GLOBAL_CATALOG.filter(p => 
                p.name.toLowerCase().includes(q) || 
                p.brand.toLowerCase().includes(q) || 
                p.category.toLowerCase().includes(q)
            );
            
            if (results.length > 0) {
                 window.location.href = `${this.getCategoryPage(results[0].category)}?search=${encodeURIComponent(query)}`;
            } else {
                 window.location.href = `index.html?search=${encodeURIComponent(query)}`;
            }
        }
    },

    /**
     * Unified Global Search Overlay
     */
    renderSearchOverlay() {
        if (document.getElementById('searchOverlay')) return;

        const html = `
            <div id="searchOverlay" class="fixed inset-0 z-[150] hidden">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity" onclick="ShopUI.closeSearch()"></div>
                <div class="relative max-w-2xl mx-auto mt-24 p-6 transform transition-all">
                    <div class="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
                        <div class="p-6 border-b flex items-center gap-4 bg-slate-50/50">
                            <i data-lucide="search" class="w-6 h-6 text-indigo-500"></i>
                            <input type="text" id="globalSearchInput" placeholder="Search for products, brands, or categories..." 
                                class="flex-1 bg-transparent border-none text-lg font-bold outline-none placeholder:text-slate-400"
                                oninput="ShopUI.handleGlobalSearch(this.value)"
                                onkeydown="ShopUI.handleSearchEnter(event, this.value)">
                            <div class="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-200/50 rounded-lg">
                                <span class="text-[10px] font-black text-slate-400">ESC</span>
                            </div>
                        </div>
                        <div id="searchResults" class="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                            <div class="py-12 text-center space-y-3">
                                <div class="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <i data-lucide="command" class="w-6 h-6"></i>
                                </div>
                                <p class="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Start typing to search the catalog</p>
                            </div>
                        </div>
                        <div class="p-4 bg-slate-50 border-t flex justify-between items-center px-8">
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Powered by ARPMart Engine</span>
                            <div class="flex items-center gap-4">
                                <span class="text-[9px] font-black text-slate-300 uppercase">Search by Brand, Name, or Type</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) lucide.createIcons();
    },

    toggleSearch() {
        const overlay = document.getElementById('searchOverlay');
        if (!overlay) {
            this.renderSearchOverlay();
            this.toggleSearch();
            return;
        }
        overlay.classList.remove('hidden');
        document.getElementById('globalSearchInput')?.focus();
    },

    closeSearch() {
        document.getElementById('searchOverlay')?.classList.add('hidden');
    },

    closeCart() {
        const modal = document.getElementById('cartModal');
        const sidebar = document.getElementById('cartSidebar');
        if (modal && !modal.classList.contains('hidden')) {
            sidebar.classList.add('translate-x-full');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    },

    handleGlobalSearch(query) {
        const resultsContainer = document.getElementById('searchResults');
        if (!query.trim()) {
            resultsContainer.innerHTML = `<div class="py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Start typing to search the catalog</div>`;
            return;
        }

        const q = query.toLowerCase();
        const results = window.GLOBAL_CATALOG.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.brand.toLowerCase().includes(q) || 
            p.category.toLowerCase().includes(q)
        ).slice(0, 8);

        if (results.length === 0) {
            resultsContainer.innerHTML = `<div class="py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No products matched "${query}"</div>`;
            return;
        }

        resultsContainer.innerHTML = results.map(p => `
            <div class="group flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100" 
                 onclick="window.location.href='${ShopUI.getCategoryPage(p.category)}?search=${encodeURIComponent(p.name)}'">
                <div class="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src="${p.image}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1">
                    <h5 class="text-sm font-bold text-slate-900">${p.name}</h5>
                    <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest">${p.category} | ${p.brand}</p>
                </div>
                <div class="text-slate-900 font-black tracking-tighter italic">₹${p.price.toLocaleString('en-IN')}</div>
                <i data-lucide="arrow-right" class="w-4 h-4 text-slate-200 group-hover:text-indigo-500 transition-colors"></i>
            </div>
        `).join('');
        
        if (window.lucide) lucide.createIcons();
    },

    attachGlobalListeners() {
        const cartBtn = document.getElementById('openCartBtn');
        if (cartBtn) cartBtn.onclick = () => this.toggleCart();

        // Global Search Trigger
        const searchBtns = document.querySelectorAll('.global-search-trigger, #globalSearchBtn');
        searchBtns.forEach(btn => btn.onclick = () => this.toggleSearch());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearch();
                this.closeCart();
                this.closeQuickView();
            }
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.toggleSearch();
            }
        });
    },

    /**
     * Renders the Product Quick View Modal Shell
     */
    renderQuickViewModal() {
        if (document.getElementById('productQuickView')) return;

        const html = `
            <div id="productQuickView" class="fixed inset-0 z-[160] hidden overflow-y-auto">
                <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="ShopUI.closeQuickView()"></div>
                <div class="flex min-h-full items-center justify-center p-4 sm:p-6">
                    <div id="quickViewContent" class="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden transform transition-all scale-95 opacity-0 duration-300">
                        <!-- Content Injected Here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    /**
     * Populates and shows the Product details
     */
    showProductDetails(productId) {
        const product = window.GLOBAL_CATALOG.find(p => p.id === productId);
        if (!product) return;

        const content = document.getElementById('quickViewContent');
        const modal = document.getElementById('productQuickView');

        content.innerHTML = `
            <div class="flex flex-col md:flex-row h-full max-h-[90vh]">
                <!-- Image Section -->
                <div class="w-full md:w-1/2 bg-slate-50 relative p-8 flex items-center justify-center group">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-auto object-contain max-h-[60vh] drop-shadow-2xl">
                    <button onclick="ShopUI.closeQuickView()" class="absolute top-8 left-8 p-3 bg-white/80 hover:bg-white backdrop-blur-md rounded-2xl shadow-sm md:hidden">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    ${product.discount ? `<span class="absolute top-8 right-8 bg-indigo-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg">-${product.discount}% OFF</span>` : ''}
                </div>
                
                <!-- Details Section -->
                <div class="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center space-y-8 bg-white overflow-y-auto">
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">${product.brand} | ${product.category}</span>
                            <button onclick="ShopUI.closeQuickView()" class="hidden md:block p-3 hover:bg-slate-100 rounded-2xl transition-all">
                                <i data-lucide="x" class="w-5 h-5 text-slate-400"></i>
                            </button>
                        </div>
                        <h2 class="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter uppercase italic">${product.name}</h2>
                        <div class="flex items-center gap-4">
                            <div class="flex items-center text-amber-500">
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <span class="ml-1 text-sm font-black">${product.rating}</span>
                                <span class="ml-1 text-slate-400 text-xs font-bold">/ 5.0</span>
                            </div>
                            <span class="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                            <span class="text-[10px] font-black uppercase text-emerald-500 tracking-wider">In Stock Ready to Ship</span>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <p class="text-slate-500 leading-relaxed font-medium">
                            ${product.description || "Experience the pinnacle of craftsmanship and design. This premium selection offers unparalleled quality and performance for the modern lifestyle."}
                        </p>
                    </div>

                    <div class="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6">
                        <div class="flex flex-col">
                            <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Premium Price</span>
                            <span class="text-4xl font-black text-slate-900 italic tracking-tighter">₹${product.price.toLocaleString('en-IN')}</span>
                        </div>
                        <button onclick="ShopUI.handleModalAddToCart('${product.id}')" class="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl active:scale-95 group">
                            <i data-lucide="shopping-cart" class="w-4 h-4 inline-block mr-2 group-hover:-translate-y-1 transition-transform"></i>
                            Add to Bag
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        setTimeout(() => {
            content.classList.remove('scale-95', 'opacity-0');
        }, 10);

        if (window.lucide) lucide.createIcons();
    },

    handleModalAddToCart(id) {
        const product = ARPMart.addToCart(id);
        if (product) {
            this.showToast(`Selected: ${product.name} added to your bag.`);
            this.closeQuickView();
        }
    },

    closeQuickView() {
        const modal = document.getElementById('productQuickView');
        const content = document.getElementById('quickViewContent');
        if (!modal) return;

        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
};

// Initialize ShopUI when DOM is ready
document.addEventListener('DOMContentLoaded', () => ShopUI.init());
