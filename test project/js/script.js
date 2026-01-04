/* ==========================================
 * GLOVOADMIN - MAIN JAVASCRIPT FILE (script.js)
 * ==========================================
 * 
 * DESCRIPTION:
 * Core JavaScript file that provides shared functionality
 * across all pages of the GlovoAdmin application.
 * 
 * FILE STRUCTURE:
 * ─────────────────────────────────────────
 * SECTION 1: AUTHENTICATION SYSTEM
 *   - DEMO_USERS: Demo credentials array
 *   - checkAuth(): Verify user session
 *   - initAuth(): Initialize auth & UI
 *   - applyRoleRestrictions(): Role-based access
 *   - login(): Authenticate user
 *   - logout(): End session
 * 
 * SECTION 2: SIDEBAR FUNCTIONALITY
 *   - initSidebar(): Toggle & responsive behavior
 * 
 * SECTION 3: LOGOUT BUTTON
 *   - initLogout(): Setup logout event
 * 
 * SECTION 4: LOCAL STORAGE DATA MANAGEMENT
 *   - getData(): Retrieve from localStorage
 *   - setData(): Save to localStorage
 *   - initSampleData(): Initialize demo data
 * 
 * SECTION 5: TOAST NOTIFICATIONS
 *   - showToast(): Display notifications
 *   - createToastContainer(): Create container
 * 
 * SECTION 6: UTILITY FUNCTIONS
 *   - generateId(): Create unique IDs
 *   - formatDate(): Format dates (FR locale)
 *   - formatCurrency(): Format currency (EUR)
 *   - exportToCSV(): Export data to CSV
 *   - debounce(): Limit function calls
 * 
 * SECTION 7: TABLE SORTING
 *   - initTableSorting(): Setup sortable headers
 *   - sortData(): Sort array by column
 * 
 * SECTION 8: PAGINATION
 *   - createPagination(): Generate pagination UI
 * 
 * SECTION 9: STATUS BADGE HELPER
 *   - getStatusBadgeClass(): Map status to CSS
 * 
 * SECTION 10: LOGIN PAGE INITIALIZATION
 *   - initLoginPage(): Handle login form
 * 
 * SECTION 11: GLOBAL INITIALIZATION
 *   - DOMContentLoaded event handler
 * 
 * DEPENDENCIES:
 * - None (pure vanilla JavaScript)
 * 
 * USED BY:
 * - All HTML pages (loaded via <script>)
 * - All page-specific JS files depend on this
 * 
 * @author GlovoAdmin Team
 * @version 1.0.0
 * ========================================== */

/* ------------------------------------------
 * SECTION 1: AUTHENTICATION SYSTEM
 * ------------------------------------------
 * Handles user login, session management,
 * and role-based access control.
 * Demo credentials: admin@app.com / admin123
 * ------------------------------------------ */

/**
 * Demo Users Array
 * @constant {Array<Object>}
 * @description Pre-defined users for demo purposes.
 * In production, this would be replaced with API calls.
 */
const DEMO_USERS = [
    { email: 'admin@app.com', password: 'admin123', name: 'Admin', role: 'admin' }
];

/**
 * Check Authentication Status
 * @function checkAuth
 * @returns {Object|null} Current user object or null if not authenticated
 * @description Verifies if user is logged in by checking localStorage.
 * Redirects to login page if no valid session found.
 */
function checkAuth() {
    // Retrieve user data from browser storage
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        // If no user found, force redirect to login
        window.location.href = 'login.html';
        return null;
    }
    return currentUser;
}

/**
 * Initialize Authentication
 * @function initAuth
 * @returns {Object|null} Current user object or null
 * @description Sets up authenticated page: displays username,
 * applies role restrictions. Called on page load.
 */
function initAuth() {
    const user = checkAuth();
    if (user) {
        // Display the user's name in the top bar
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = user.name;
        }
        // Setup permissions (e.g. hide delete buttons for non-admins)
        applyRoleRestrictions(user);
    }
    return user;
}

/**
 * Apply Role-Based Restrictions
 * @function applyRoleRestrictions
 * @param {Object} user - Current user object with role property
 * @description Stores user role globally for other scripts.
 * Used to hide/show admin-only features.
 */
function applyRoleRestrictions(user) {
    // Save role to global window object so other scripts can access it
    window.currentUserRole = user.role;
}

/**
 * Login Function
 * @function login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {boolean} True if login successful, false otherwise
 * @description Validates credentials against DEMO_USERS array.
 * Stores user session in localStorage on success.
 */
function login(email, password) {
    // Check if credentials match any user in the DEMO_USERS array
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (user) {
        // Save user to storage so they stay logged in
        localStorage.setItem('user', JSON.stringify(user));
        return true;
    }
    return false;
}

/**
 * Logout Function
 * @function logout
 * @description Clears user session and redirects to login page.
 */
function logout() {
    // Remove user data
    localStorage.removeItem('user');
    // Redirect
    window.location.href = 'login.html';
}

/* ------------------------------------------
 * SECTION 2: SIDEBAR FUNCTIONALITY
 * ------------------------------------------
 * Handles responsive sidebar toggle behavior
 * for desktop collapse and mobile show/hide.
 * ------------------------------------------ */

/**
 * Initialize Sidebar
 * @function initSidebar
 * @description Sets up sidebar toggle:
 * - Desktop (>992px): Collapse/expand sidebar
 * - Mobile (≤992px): Show/hide overlay sidebar
 * - Closes sidebar when clicking outside on mobile
 */
function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            if (window.innerWidth > 992) {
                // Desktop: Shrink sidebar
                sidebar.classList.toggle('collapsed');
            } else {
                // Mobile: Slide sidebar in/out
                sidebar.classList.toggle('show');
            }
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }
}

/* ------------------------------------------
 * SECTION 3: LOGOUT BUTTON
 * ------------------------------------------
 * Initializes the logout button click handler.
 * ------------------------------------------ */

/**
 * Initialize Logout Button
 * @function initLogout
 * @description Attaches click event to logout button.
 */
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

/* ------------------------------------------
 * SECTION 4: LOCAL STORAGE DATA MANAGEMENT
 * ------------------------------------------
 * CRUD operations for localStorage persistence.
 * All data stored as JSON strings.
 * ------------------------------------------ */

/**
 * Get Data from LocalStorage
 * @function getData
 * @param {string} key - Storage key (users, products, clients, orders, deliveries)
 * @returns {Array|Object|null} Parsed data or null if not found
 */
function getData(key) {
    const data = localStorage.getItem(key);
    // Convert string back to object/array
    return data ? JSON.parse(data) : null;
}

/**
 * Set Data to LocalStorage
 * @function setData
 * @param {string} key - Storage key
 * @param {*} data - Data to store (will be JSON stringified)
 */
function setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Initialize Sample Data
 * @function initSampleData
 * @description Populates localStorage with demo data if not exists.
 * Creates: users, products, clients, orders, deliveries.
 * Called once on first app load.
 */
function initSampleData() {
    
    /* ---- USERS DATA ----
     * Roles: Admin, Livreur (Driver), Client, Manager
     * Status: Actif (Active), Inactif (Inactive)
     */
    if (!getData('users')) {
        setData('users', [
            { id: 1, name: 'Admin Système', email: 'admin@app.com', role: 'Admin', status: 'Actif', createdAt: '2024-01-15' },
            { id: 2, name: 'Jean Dupont', email: 'jean.dupont@email.com', role: 'Livreur', status: 'Actif', createdAt: '2024-02-10' },
            { id: 3, name: 'Marie Martin', email: 'marie.martin@email.com', role: 'Client', status: 'Actif', createdAt: '2024-02-15' },
            { id: 4, name: 'Pierre Bernard', email: 'pierre.bernard@email.com', role: 'Livreur', status: 'Inactif', createdAt: '2024-03-01' },
            { id: 5, name: 'Sophie Petit', email: 'sophie.petit@email.com', role: 'Client', status: 'Actif', createdAt: '2024-03-05' },
            { id: 6, name: 'Lucas Moreau', email: 'lucas.moreau@email.com', role: 'Livreur', status: 'Actif', createdAt: '2024-03-10' },
            { id: 7, name: 'Emma Leroy', email: 'emma.leroy@email.com', role: 'Client', status: 'Actif', createdAt: '2024-03-15' },
            { id: 8, name: 'Thomas Roux', email: 'thomas.roux@email.com', role: 'Manager', status: 'Actif', createdAt: '2024-03-20' },
            { id: 9, name: 'Julie Fournier', email: 'julie.fournier@email.com', role: 'Client', status: 'Inactif', createdAt: '2024-04-01' },
            { id: 10, name: 'Antoine Garcia', email: 'antoine.garcia@email.com', role: 'Livreur', status: 'Actif', createdAt: '2024-04-05' },
            { id: 11, name: 'Camille Blanc', email: 'camille.blanc@email.com', role: 'Client', status: 'Actif', createdAt: '2024-04-10' },
            { id: 12, name: 'Mathieu Simon', email: 'mathieu.simon@email.com', role: 'Livreur', status: 'Actif', createdAt: '2024-04-15' }
        ]);
    }

    /* ---- PRODUCTS DATA ----
     * Categories: Pizza, Burger, Salade, Japonais, etc.
     * Available: true/false for stock status
     */
    if (!getData('products')) {
        setData('products', [
            { id: 1, name: 'Pizza Margherita', category: 'Pizza', price: 12.99, stock: 50, supplier: 'Pizzeria Roma', available: true },
            { id: 2, name: 'Burger Classic', category: 'Burger', price: 9.99, stock: 35, supplier: 'Burger House', available: true },
            { id: 3, name: 'Salade César', category: 'Salade', price: 8.50, stock: 25, supplier: 'Fresh Garden', available: true },
            { id: 4, name: 'Sushi Mix', category: 'Japonais', price: 18.99, stock: 20, supplier: 'Tokyo Sushi', available: true },
            { id: 5, name: 'Tacos Mexicain', category: 'Mexicain', price: 11.50, stock: 40, supplier: 'Casa Mexico', available: true },
            { id: 6, name: 'Pasta Carbonara', category: 'Italien', price: 13.99, stock: 30, supplier: 'Pizzeria Roma', available: true },
            { id: 7, name: 'Kebab Complet', category: 'Oriental', price: 8.99, stock: 45, supplier: 'Istanbul Grill', available: true },
            { id: 8, name: 'Poke Bowl', category: 'Healthy', price: 14.50, stock: 15, supplier: 'Fresh Garden', available: false },
            { id: 9, name: 'Pad Thai', category: 'Asiatique', price: 12.50, stock: 25, supplier: 'Thai Express', available: true },
            { id: 10, name: 'Crêpe Complète', category: 'Français', price: 10.99, stock: 0, supplier: 'Crêperie Bretonne', available: false },
            { id: 11, name: 'Fish & Chips', category: 'Britannique', price: 11.99, stock: 30, supplier: 'British Corner', available: true },
            { id: 12, name: 'Falafel Wrap', category: 'Oriental', price: 9.50, stock: 35, supplier: 'Istanbul Grill', available: true }
        ]);
    }

    /* ---- CLIENTS DATA ----
     * Types: Particulier (Individual), Entreprise (Business)
     * Cities: Paris, Lyon, Montpellier, Bordeaux, Nice, Lille
     */
    if (!getData('clients')) {
        setData('clients', [
            { id: 1, name: 'Marie Martin', email: 'marie.martin@email.com', phone: '0612345678', address: '12 Rue de Paris, 75001 Paris', city: 'Paris', type: 'Particulier', createdAt: '2024-01-10' },
            { id: 2, name: 'Restaurant Le Gourmet', email: 'contact@legourmet.fr', phone: '0145678901', address: '45 Avenue des Champs, 75008 Paris', city: 'Paris', type: 'Entreprise', createdAt: '2024-01-15' },
            { id: 3, name: 'Sophie Petit', email: 'sophie.petit@email.com', phone: '0623456789', address: '8 Rue de Lyon, 69001 Lyon', city: 'Lyon', type: 'Particulier', createdAt: '2024-02-01' },
            { id: 4, name: 'Café Central', email: 'info@cafecentral.fr', phone: '0467891234', address: '22 Place de la Comédie, 34000 Montpellier', city: 'Montpellier', type: 'Entreprise', createdAt: '2024-02-15' },
            { id: 5, name: 'Emma Leroy', email: 'emma.leroy@email.com', phone: '0634567890', address: '15 Boulevard Victor Hugo, 33000 Bordeaux', city: 'Bordeaux', type: 'Particulier', createdAt: '2024-03-01' },
            { id: 6, name: 'Hôtel Royal', email: 'reservation@hotelroyal.fr', phone: '0491234567', address: '100 Promenade des Anglais, 06000 Nice', city: 'Nice', type: 'Entreprise', createdAt: '2024-03-10' },
            { id: 7, name: 'Camille Blanc', email: 'camille.blanc@email.com', phone: '0645678901', address: '3 Rue Nationale, 59000 Lille', city: 'Lille', type: 'Particulier', createdAt: '2024-03-20' },
            { id: 8, name: 'Boulangerie Paul', email: 'contact@boulangeripaul.fr', phone: '0320123456', address: '7 Grand Place, 59000 Lille', city: 'Lille', type: 'Entreprise', createdAt: '2024-04-01' },
            { id: 9, name: 'Lucas Noir', email: 'lucas.noir@email.com', phone: '0656789012', address: '28 Quai des Chartrons, 33000 Bordeaux', city: 'Bordeaux', type: 'Particulier', createdAt: '2024-04-10' },
            { id: 10, name: 'Traiteur Excellence', email: 'traiteur@excellence.fr', phone: '0156789012', address: '56 Rue du Commerce, 75015 Paris', city: 'Paris', type: 'Entreprise', createdAt: '2024-04-15' }
        ]);
    }

    /* ---- ORDERS DATA ----
     * Status: Livrée, En cours, En attente, Annulée
     * PaymentStatus: Payée, En attente, Remboursée
     */
    if (!getData('orders')) {
        setData('orders', [
            { id: 1, clientId: 1, clientName: 'Marie Martin', products: 'Pizza Margherita x2', quantity: 2, amount: 25.98, status: 'Livrée', paymentStatus: 'Payée', address: '12 Rue de Paris, 75001 Paris', createdAt: '2024-04-01' },
            { id: 2, clientId: 3, clientName: 'Sophie Petit', products: 'Sushi Mix, Poke Bowl', quantity: 2, amount: 33.49, status: 'En cours', paymentStatus: 'Payée', address: '8 Rue de Lyon, 69001 Lyon', createdAt: '2024-04-05' },
            { id: 3, clientId: 2, clientName: 'Restaurant Le Gourmet', products: 'Pasta Carbonara x10', quantity: 10, amount: 139.90, status: 'Livrée', paymentStatus: 'Payée', address: '45 Avenue des Champs, 75008 Paris', createdAt: '2024-04-07' },
            { id: 4, clientId: 5, clientName: 'Emma Leroy', products: 'Burger Classic x3', quantity: 3, amount: 29.97, status: 'En attente', paymentStatus: 'En attente', address: '15 Boulevard Victor Hugo, 33000 Bordeaux', createdAt: '2024-04-10' },
            { id: 5, clientId: 7, clientName: 'Camille Blanc', products: 'Tacos Mexicain, Kebab Complet', quantity: 2, amount: 20.49, status: 'Livrée', paymentStatus: 'Payée', address: '3 Rue Nationale, 59000 Lille', createdAt: '2024-04-12' },
            { id: 6, clientId: 4, clientName: 'Café Central', products: 'Salade César x15', quantity: 15, amount: 127.50, status: 'En cours', paymentStatus: 'Payée', address: '22 Place de la Comédie, 34000 Montpellier', createdAt: '2024-04-14' },
            { id: 7, clientId: 9, clientName: 'Lucas Noir', products: 'Fish & Chips', quantity: 1, amount: 11.99, status: 'Annulée', paymentStatus: 'Remboursée', address: '28 Quai des Chartrons, 33000 Bordeaux', createdAt: '2024-04-15' },
            { id: 8, clientId: 6, clientName: 'Hôtel Royal', products: 'Crêpe Complète x20', quantity: 20, amount: 219.80, status: 'Livrée', paymentStatus: 'Payée', address: '100 Promenade des Anglais, 06000 Nice', createdAt: '2024-04-16' },
            { id: 9, clientId: 1, clientName: 'Marie Martin', products: 'Pad Thai x2', quantity: 2, amount: 25.00, status: 'En attente', paymentStatus: 'En attente', address: '12 Rue de Paris, 75001 Paris', createdAt: '2024-04-18' },
            { id: 10, clientId: 10, clientName: 'Traiteur Excellence', products: 'Falafel Wrap x30', quantity: 30, amount: 285.00, status: 'En cours', paymentStatus: 'Payée', address: '56 Rue du Commerce, 75015 Paris', createdAt: '2024-04-20' },
            { id: 11, clientId: 3, clientName: 'Sophie Petit', products: 'Pizza Margherita', quantity: 1, amount: 12.99, status: 'Livrée', paymentStatus: 'Payée', address: '8 Rue de Lyon, 69001 Lyon', createdAt: '2024-04-21' },
            { id: 12, clientId: 8, clientName: 'Boulangerie Paul', products: 'Burger Classic x5', quantity: 5, amount: 49.95, status: 'En attente', paymentStatus: 'En attente', address: '7 Grand Place, 59000 Lille', createdAt: '2024-04-22' }
        ]);
    }

    /* ---- DELIVERIES DATA ----
     * Status: Livrée, En cours, En attente, Échec
     * Links to orders via orderId
     */
    if (!getData('deliveries')) {
        setData('deliveries', [
            { id: 1, orderId: 1, driver: 'Jean Dupont', address: '12 Rue de Paris, 75001 Paris', status: 'Livrée', duration: 25, notes: 'Client satisfait', createdAt: '2024-04-01' },
            { id: 2, orderId: 2, driver: 'Lucas Moreau', address: '8 Rue de Lyon, 69001 Lyon', status: 'En cours', duration: 30, notes: '', createdAt: '2024-04-05' },
            { id: 3, orderId: 3, driver: 'Antoine Garcia', address: '45 Avenue des Champs, 75008 Paris', status: 'Livrée', duration: 35, notes: 'Livraison express', createdAt: '2024-04-07' },
            { id: 4, orderId: 5, driver: 'Jean Dupont', address: '3 Rue Nationale, 59000 Lille', status: 'Livrée', duration: 20, notes: '', createdAt: '2024-04-12' },
            { id: 5, orderId: 6, driver: 'Mathieu Simon', address: '22 Place de la Comédie, 34000 Montpellier', status: 'En cours', duration: 40, notes: 'Grande commande', createdAt: '2024-04-14' },
            { id: 6, orderId: 8, driver: 'Lucas Moreau', address: '100 Promenade des Anglais, 06000 Nice', status: 'Livrée', duration: 45, notes: '', createdAt: '2024-04-16' },
            { id: 7, orderId: 10, driver: 'Antoine Garcia', address: '56 Rue du Commerce, 75015 Paris', status: 'En cours', duration: 50, notes: 'Commande volume', createdAt: '2024-04-20' },
            { id: 8, orderId: 11, driver: 'Jean Dupont', address: '8 Rue de Lyon, 69001 Lyon', status: 'Livrée', duration: 22, notes: '', createdAt: '2024-04-21' },
            { id: 9, orderId: 4, driver: 'Mathieu Simon', address: '15 Boulevard Victor Hugo, 33000 Bordeaux', status: 'En attente', duration: 35, notes: 'Attente confirmation', createdAt: '2024-04-10' },
            { id: 10, orderId: 9, driver: 'Lucas Moreau', address: '12 Rue de Paris, 75001 Paris', status: 'En attente', duration: 25, notes: '', createdAt: '2024-04-18' }
        ]);
    }
}

// ==========================================
/* ------------------------------------------
 * SECTION 5: TOAST NOTIFICATIONS
 * ------------------------------------------
 * Visual feedback system for user actions.
 * Types: success, error, warning, info
 * Auto-dismisses after 3 seconds.
 * ------------------------------------------ */

/**
 * Show Toast Notification
 * @function showToast
 * @param {string} message - Message to display
 * @param {string} [type='info'] - Toast type (success|error|warning|info)
 * @description Creates and displays a toast notification.
 * Automatically removes itself after 3 seconds.
 */
function showToast(message, type = 'info') {
    // Find or create the container for toasts
    const container = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon mapping for each toast type
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[type] || 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Create Toast Container
 * @function createToastContainer
 * @returns {HTMLElement} The toast container element
 * @description Creates container div if not exists.
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

/* ------------------------------------------
 * SECTION 6: UTILITY FUNCTIONS
 * ------------------------------------------
 * Reusable helper functions used across
 * all page-specific JavaScript files.
 * ------------------------------------------ */

/**
 * Generate Unique ID
 * @function generateId
 * @param {string} dataKey - LocalStorage key to check
 * @returns {number} Next available ID
 * @description Finds max ID in dataset and returns +1.
 */
function generateId(dataKey) {
    const data = getData(dataKey) || [];
    // If data exists, find the highest ID and add 1. Else start at 1.
    return data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
}

/**
 * Escape HTML for XSS Prevention
 * @function escapeHtml
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML insertion
 * @description Prevents XSS attacks by escaping special characters.
 */
function escapeHtml(text) {
    if (!text) return '';
    // Trick: Create a fake element, set text (safe), then get HTML
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format Date (French Locale)
 * @function formatDate
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date (e.g., "15 avr. 2024")
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

/**
 * Format Currency (EUR)
 * @function formatCurrency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency (e.g., "12,99 €")
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

/**
 * Export Data to CSV
 * @function exportToCSV
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Base filename (without extension)
 * @param {Array<string>} headers - Column headers
 * @description Converts data to CSV format and triggers download.
 * Handles UTF-8 BOM for Excel compatibility.
 */
function exportToCSV(data, filename, headers) {
    // Build CSV string: Headers first, then data rows
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            // Handle values that might contain commas by wrapping in quotes
            const value = row[header.toLowerCase().replace(/\s/g, '')] || row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(','))
    ].join('\n');
    
    // Create blob with UTF-8 BOM for Excel
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

/**
 * Debounce Function
 * @function debounce
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 * @description Limits function execution rate.
 * Used for search input to prevent excessive API calls.
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* ------------------------------------------
 * SECTION 7: TABLE SORTING
 * ------------------------------------------
 * Click-to-sort functionality for data tables.
 * Supports ascending/descending toggle.
 * ------------------------------------------ */

/**
 * Initialize Table Sorting
 * @function initTableSorting
 * @param {string} tableId - ID of table element
 * @param {Function} renderCallback - Function to re-render table
 * @returns {Object} Current sort state {column, direction}
 * @description Sets up click handlers on th[data-sort] headers.
 */
function initTableSorting(tableId, renderCallback) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    // Find all headers that have the 'data-sort' attribute
    const headers = table.querySelectorAll('th[data-sort]');
    let currentSort = { column: null, direction: 'asc' };
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            
            // Toggle direction if same column
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            
            // Update visual indicators
            headers.forEach(h => {
                h.classList.remove('sorted-asc', 'sorted-desc');
            });
            header.classList.add(`sorted-${currentSort.direction}`);
            
            if (renderCallback) {
                renderCallback(currentSort);
            }
        });
    });
    
    return currentSort;
}

/**
 * Sort Data Array
 * @function sortData
 * @param {Array} data - Array to sort
 * @param {string} column - Column/property to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} New sorted array
 * @description Generic sort supporting numbers and strings.
 */
function sortData(data, column, direction) {
    return [...data].sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        
        // Handle numbers
        if (!isNaN(valA) && !isNaN(valB)) {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        }
        
        // Handle strings (case-insensitive)
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/* ------------------------------------------
 * SECTION 8: PAGINATION
 * ------------------------------------------
 * Generates pagination controls and info text.
 * Supports configurable items per page.
 * ------------------------------------------ */

/**
 * Create Pagination Controls
 * @function createPagination
 * @param {number} totalItems - Total number of items
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} itemsPerPage - Items shown per page
 * @param {Function} callback - Function called with new page number
 * @description Renders pagination buttons with ellipsis for large datasets.
 */
function createPagination(totalItems, currentPage, itemsPerPage, callback) {
    // Calculate total pages needed
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('paginationInfo');
    
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => callback(currentPage - 1));
    pagination.appendChild(prevBtn);
    
    // Calculate visible page range
    // Logic: Show 5 pages at a time (e.g., 1 2 [3] 4 5)
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page + ellipsis
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.textContent = '1';
        firstBtn.addEventListener('click', () => callback(1));
        pagination.appendChild(firstBtn);
        
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '0 10px';
            pagination.appendChild(dots);
        }
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.addEventListener('click', () => callback(i));
        pagination.appendChild(pageBtn);
    }
    
    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '0 10px';
            pagination.appendChild(dots);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.textContent = totalPages;
        lastBtn.addEventListener('click', () => callback(totalPages));
        pagination.appendChild(lastBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.addEventListener('click', () => callback(currentPage + 1));
    pagination.appendChild(nextBtn);
    
    // Update info text
    if (paginationInfo) {
        const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);
        paginationInfo.textContent = `Affichage ${start}-${end} sur ${totalItems}`;
    }
}

/* ------------------------------------------
 * SECTION 9: STATUS BADGE HELPER
 * ------------------------------------------
 * Maps status text to CSS badge class.
 * ------------------------------------------ */

/**
 * Get Status Badge CSS Class
 * @function getStatusBadgeClass
 * @param {string} status - Status text
 * @returns {string} CSS class name (success|danger|info|warning|primary)
 * @description Universal status-to-class mapper for badges.
 */
function getStatusBadgeClass(status) {
    const statusMap = {
        'Actif': 'success',
        'Inactif': 'danger',
        'Livrée': 'success',
        'En cours': 'info',
        'En attente': 'warning',
        'Annulée': 'danger',
        'Échec': 'danger',
        'Payée': 'success',
        'Remboursée': 'warning',
        'true': 'success',
        'false': 'danger'
    };
    return statusMap[status] || 'primary';
}

/* ------------------------------------------
 * SECTION 10: LOGIN PAGE INITIALIZATION
 * ------------------------------------------
 * Handles login form submission and validation.
 * ------------------------------------------ */

/**
 * Initialize Login Page
 * @function initLoginPage
 * @description Sets up login form:
 * - Redirects if already logged in
 * - Handles form submission
 * - Shows error message on failed login
 */
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loginForm) {
        // Redirect if already authenticated
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (login(email, password)) {
                window.location.href = 'dashboard.html';
            } else {
                errorMessage.textContent = 'Email ou mot de passe incorrect';
                errorMessage.classList.add('show');
            }
        });
    }
}

/* ------------------------------------------
 * SECTION 11: GLOBAL INITIALIZATION
 * ------------------------------------------
 * Entry point - runs on every page load.
 * ------------------------------------------ */

/**
 * DOMContentLoaded Event Handler
 * @description Main initialization:
 * 1. Initialize sample data (first visit)
 * 2. Check if login page or authenticated page
 * 3. Initialize appropriate handlers
 */
document.addEventListener('DOMContentLoaded', () => {
    // Always initialize sample data
    initSampleData();
    
    // Determine page type
    const isLoginPage = document.getElementById('loginForm');
    
    if (isLoginPage) {
        initLoginPage();
    } else {
        // Authenticated pages
        initAuth();
        initSidebar();
        initLogout();
    }
});

/* ==========================================
 * END OF SCRIPT.JS
 * ==========================================
 * 
 * SUMMARY:
 * Core utility file providing:
 * - Authentication (demo login system)
 * - LocalStorage CRUD operations
 * - UI helpers (toasts, pagination, sorting)
 * - Data formatting (dates, currency)
 * - CSV export functionality
 * 
 * All page-specific JS files depend on this.
 * ========================================== */