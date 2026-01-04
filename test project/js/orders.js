/* ==========================================
 * GlovoAdmin - Orders Management JavaScript
 * ==========================================
 * 
 * PURPOSE:
 * Handles all order-related operations including:
 * - Display orders in a sortable, paginated table
 * - Create new orders (Nouvelle Commande)
 * - View order details
 * - Edit existing orders (Admin only)
 * - Delete orders (Admin only)
 * - Filter and search orders
 * - Export orders to CSV
 * 
 * DEPENDENCIES:
 * - script.js (must be loaded first)
 *   - getData(), setData() - localStorage operations
 *   - generateId() - unique ID generation
 *   - formatDate(), formatCurrency() - formatting
 *   - showToast() - notifications
 *   - initTableSorting(), sortData() - table sorting
 *   - createPagination() - pagination
 *   - getStatusBadgeClass() - status styling
 *   - debounce() - input debouncing
 *   - exportToCSV() - CSV export
 *   - initAuth() - authentication check
 * 
 * HTML ELEMENTS REQUIRED:
 * - #addNewBtn - Button to open new order modal
 * - #modalOverlay, #viewModalOverlay, #deleteModalOverlay - Modal containers
 * - #entityForm - Order form
 * - #dataTable, #tableBody - Data table
 * - #searchInput, #filterStatus, #filterPayment - Filters
 * - #rowsPerPage - Pagination control
 * - #exportCsvBtn - CSV export button
 * 
 * AUTHOR: GlovoAdmin Team
 * VERSION: 2.0.0 (Optimized & Bug Fixed)
 * ========================================== */

/* ------------------------------------------
 * SECTION 1: STATE VARIABLES
 * ------------------------------------------
 * Global state for pagination, sorting, and editing.
 */

/** @type {number} Current page number (1-indexed) */
let currentPage = 1;

/** @type {number} Number of items displayed per page */
let itemsPerPage = 10;

/** @type {Object} Current sort configuration */
let currentSort = { column: 'id', direction: 'asc' };

/** @type {number|null} ID of order being edited, null for new order */
let editingId = null;

/** @type {number|null} ID of order pending deletion */
let deleteId = null;

/* ------------------------------------------
 * SECTION 2: INITIALIZATION
 * ------------------------------------------
 * Entry point and setup functions.
 */

/**
 * DOM Content Loaded Handler
 * Entry point for orders page initialization.
 * Checks authentication before proceeding.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verify user is authenticated (redirects to login if not)
    if (!initAuth()) return;
    
    // Initialize orders page components
    initOrdersPage();
});

/**
 * Initialize Orders Page
 * Sets up all page components: selects, table, filters, modals.
 */
function initOrdersPage() {
    // Populate dropdown select elements
    populateClientSelect();
    populateProductSelect();
    
    // Render data table with orders
    renderTable();
    
    // Initialize filter event listeners
    initFilters();
    
    // Initialize modal dialogs
    initModal();
    
    // Initialize table column sorting
    initTableSorting('dataTable', (sort) => {
        currentSort = sort;
        renderTable();
    });
}

/* ------------------------------------------
 * SECTION 3: SELECT POPULATION
 * ------------------------------------------
 * Functions to populate dropdown select elements.
 */

/**
 * Populate Client Select Dropdown
 * Loads clients from localStorage and creates options.
 * Used in the order form for client selection.
 * 
 * NOTE: HTML element ID is 'client' (not 'clientId')
 */
function populateClientSelect() {
    // Get clients from storage
    const clients = getData('clients') || [];
    const clientSelect = document.getElementById('client');
    
    // Safety check - exit if element not found
    if (!clientSelect) {
        console.warn('Client select element (#client) not found');
        return;
    }
    
    // Add each client as an option
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        clientSelect.appendChild(option);
    });
}

/**
 * Populate Product Select Dropdown
 * Loads available products from localStorage.
 * Only shows products marked as available.
 * 
 * NOTE: HTML element ID is 'product' (not 'products')
 */
function populateProductSelect() {
    const products = getData('products') || [];
    const productSelect = document.getElementById('product');
    
    // Safety check - exit if element not found
    if (!productSelect) {
        console.warn('Product select element (#product) not found');
        return;
    }
    
    // Filter for available products only and add as options
    products
        .filter(p => p.available)
        .forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = `${product.name} - ${formatCurrency(product.price)}`;
            productSelect.appendChild(option);
        });
}

/* ------------------------------------------
 * SECTION 4: TABLE RENDERING
 * ------------------------------------------
 * Render orders data in the table with pagination.
 */

/**
 * Render Orders Table
 * Main function to display orders in the data table.
 * Applies filters, sorting, and pagination.
 * Handles empty state display.
 */
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    
    // Safety check
    if (!tableBody) {
        console.error('Table body element (#tableBody) not found');
        return;
    }
    
    // Get orders data from localStorage
    let data = getData('orders') || [];
    
    // Apply search and filter criteria
    data = applyFilters(data);
    
    // Apply column sorting
    if (currentSort.column) {
        data = sortData(data, currentSort.column, currentSort.direction);
    }
    
    // Calculate pagination
    const totalItems = data.length;
    // Logic: Page 1 starts at index 0, Page 2 starts at index 10 (if 10 per page)
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);
    
    // Check if user is admin (controls edit/delete visibility)
    const isAdmin = window.currentUserRole === 'admin';
    
    // Render table rows
    tableBody.innerHTML = paginatedData.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${escapeHtml(order.clientName)}</td>
            <td>${escapeHtml(order.products)}</td>
            <td>${order.quantity}</td>
            <td>${formatCurrency(order.amount)}</td>
            <td><span class="status-badge ${getStatusBadgeClass(order.status)}">${order.status}</span></td>
            <td><span class="status-badge ${getStatusBadgeClass(order.paymentStatus)}">${order.paymentStatus}</span></td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewItem(${order.id})" title="Voir">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${isAdmin ? `
                        <button class="action-btn edit" onclick="editItem(${order.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteItem(${order.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
    
    // Display empty state if no data
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Aucune commande trouvée</h3>
                    <p>Ajoutez une nouvelle commande ou modifiez vos filtres</p>
                </td>
            </tr>
        `;
    }
    
    // Update pagination controls
    createPagination(totalItems, currentPage, itemsPerPage, (page) => {
        currentPage = page;
        renderTable();
    });
}

/**
 * Escape HTML special characters
 * Prevents XSS attacks when displaying user data.
 * 
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ------------------------------------------
 * SECTION 5: FILTERS
 * ------------------------------------------
 * Handle search and filter functionality.
 */

/**
 * Apply Filters to Data
 * Filters orders based on search term, status, and payment method.
 * 
 * @param {Array<Object>} data - Orders array to filter
 * @returns {Array<Object>} Filtered orders array
 */
function applyFilters(data) {
    // Get filter values from UI elements
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const paymentFilter = document.getElementById('filterPayment')?.value || '';
    
    return data.filter(item => {
        // Search matches: client name, products, or order ID
        const matchesSearch = !searchTerm || 
            item.clientName.toLowerCase().includes(searchTerm) ||
            item.products.toLowerCase().includes(searchTerm) ||
            item.id.toString().includes(searchTerm);
        
        // Status filter match
        const matchesStatus = !statusFilter || item.status === statusFilter;
        
        // Payment filter match
        const matchesPayment = !paymentFilter || item.paymentStatus === paymentFilter;
        
        // Return true only if all conditions match
        return matchesSearch && matchesStatus && matchesPayment;
    });
}

/**
 * Initialize Filter Event Listeners
 * Sets up event handlers for all filter controls.
 * Uses debounce for search input to reduce re-renders.
 */
function initFilters() {
    // Get filter elements
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const filterPayment = document.getElementById('filterPayment');
    const rowsPerPage = document.getElementById('rowsPerPage');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    
    // Search input - debounced to prevent excessive re-renders
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1; // Reset to first page
            renderTable();
        }, 300));
    }
    
    // Status filter - immediate update
    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            currentPage = 1;
            renderTable();
        });
    }
    
    // Payment filter - immediate update
    if (filterPayment) {
        filterPayment.addEventListener('change', () => {
            currentPage = 1;
            renderTable();
        });
    }
    
    // Rows per page selector
    if (rowsPerPage) {
        rowsPerPage.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value, 10);
            currentPage = 1;
            renderTable();
        });
    }
    
    // CSV Export button
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', handleExportCSV);
    }
}

/**
 * Handle CSV Export
 * Exports all orders (unfiltered) to a CSV file.
 */
function handleExportCSV() {
    const data = getData('orders') || [];
    const headers = ['ID', 'Client', 'Produits', 'Quantité', 'Montant', 'Statut', 'Paiement', 'Date'];
    exportToCSV(data, 'commandes', headers);
    showToast('Export CSV réussi', 'success');
}

/* ------------------------------------------
 * SECTION 6: MODAL HANDLING
 * ------------------------------------------
 * Initialize and control modal dialogs:
 * - Add/Edit modal for creating/updating orders
 * - View modal for displaying order details
 * - Delete confirmation modal
 */

/**
 * Initialize Modal Dialogs
 * Sets up event listeners for all modal interactions.
 * Handles open, close, and form submission.
 */
function initModal() {
    // ========== GET DOM ELEMENTS ==========
    
    // Add/Edit Modal elements
    const addNewBtn = document.getElementById('addNewBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const entityForm = document.getElementById('entityForm');
    
    // View Modal elements
    const viewModalOverlay = document.getElementById('viewModalOverlay');
    const viewModalClose = document.getElementById('viewModalClose');
    const closeViewBtn = document.getElementById('closeViewBtn');
    
    // Delete Modal elements
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    const deleteModalClose = document.getElementById('deleteModalClose');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // ========== ADD NEW BUTTON - Opens empty form ==========
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
            // Reset editing state
            editingId = null;
            
            // Update modal title
            document.getElementById('modalTitle').textContent = 'Nouvelle Commande';
            
            // Reset form fields
            if (entityForm) entityForm.reset();
            
            // Show modal
            modalOverlay.classList.add('show');
        });
    }
    
    // ========== CLOSE MODAL HANDLERS ==========
    
    // Close Add/Edit modal
    if (modalClose) {
        modalClose.addEventListener('click', () => modalOverlay.classList.remove('show'));
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modalOverlay.classList.remove('show'));
    }
    
    // Close View modal
    if (viewModalClose) {
        viewModalClose.addEventListener('click', () => viewModalOverlay.classList.remove('show'));
    }
    if (closeViewBtn) {
        closeViewBtn.addEventListener('click', () => viewModalOverlay.classList.remove('show'));
    }
    
    // Close Delete modal
    if (deleteModalClose) {
        deleteModalClose.addEventListener('click', () => deleteModalOverlay.classList.remove('show'));
    }
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => deleteModalOverlay.classList.remove('show'));
    }
    
    // ========== CLOSE ON OVERLAY CLICK ==========
    // Clicking outside the modal content closes it
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.classList.remove('show');
        });
    }
    
    if (viewModalOverlay) {
        viewModalOverlay.addEventListener('click', (e) => {
            if (e.target === viewModalOverlay) viewModalOverlay.classList.remove('show');
        });
    }
    
    if (deleteModalOverlay) {
        deleteModalOverlay.addEventListener('click', (e) => {
            if (e.target === deleteModalOverlay) deleteModalOverlay.classList.remove('show');
        });
    }
    
    // ========== FORM SUBMISSION ==========
    if (entityForm) {
        entityForm.addEventListener('submit', handleFormSubmit);
    }
    
    // ========== DELETE CONFIRMATION ==========
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
}

/* ------------------------------------------
 * SECTION 7: CRUD OPERATIONS
 * ------------------------------------------
 * Create, Read, Update, Delete operations for orders.
 */

/**
 * Handle Form Submit
 * Processes the order form for both create and update operations.
 * Validates input, builds order object, and saves to localStorage.
 * 
 * @param {Event} e - Form submit event
 * 
 * BUG FIX: Changed element IDs to match HTML:
 * - 'clientId' → 'client'
 * - 'products' → 'product'
 * - 'paymentStatus' → 'payment'
 */
function handleFormSubmit(e) {
    // Prevent form from submitting normally
    e.preventDefault();
    
    // ========== GET FORM VALUES ==========
    // NOTE: Using correct HTML element IDs
    
    // Get selected client ID and find client name
    // We need the name because we display it in the table
    const clientId = parseInt(document.getElementById('client').value, 10);
    const clients = getData('clients') || [];
    const client = clients.find(c => c.id === clientId);
    
    // Build order data object
    const formData = {
        clientId: clientId,
        clientName: client ? client.name : 'Client inconnu',
        products: document.getElementById('product').value,
        quantity: parseInt(document.getElementById('quantity').value, 10),
        amount: parseFloat(document.getElementById('amount').value),
        status: document.getElementById('status').value,
        paymentStatus: document.getElementById('payment').value, // Fixed: was 'paymentStatus'
        address: document.getElementById('address').value,
        notes: document.getElementById('notes')?.value || ''
    };
    
    // ========== VALIDATE DATA ==========
    if (!formData.clientId || !formData.products || !formData.amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    // ========== SAVE TO LOCALSTORAGE ==========
    let data = getData('orders') || [];
    
    if (editingId) {
        // UPDATE EXISTING ORDER
        const index = data.findIndex(item => item.id === editingId);
        if (index !== -1) {
            // Merge new data with existing record
            data[index] = { ...data[index], ...formData };
            showToast('Commande mise à jour avec succès', 'success');
        }
    } else {
        // CREATE NEW ORDER
        formData.id = generateId('orders');
        formData.createdAt = new Date().toISOString().split('T')[0];
        data.push(formData);
        showToast('Commande ajoutée avec succès', 'success');
    }
    
    // Save updated data
    setData('orders', data);
    
    // Close modal and refresh table
    document.getElementById('modalOverlay').classList.remove('show');
    renderTable();
}

/**
 * View Order Details
 * Opens view modal with detailed order information.
 * 
 * @param {number} id - Order ID to view
 */
function viewItem(id) {
    const data = getData('orders') || [];
    const item = data.find(o => o.id === id);
    
    if (!item) {
        showToast('Commande non trouvée', 'error');
        return;
    }
    
    // Build detail view HTML
    const viewModalBody = document.getElementById('viewModalBody');
    viewModalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <label>N° Commande</label>
                <span>#${item.id}</span>
            </div>
            <div class="detail-item">
                <label>Client</label>
                <span>${escapeHtml(item.clientName)}</span>
            </div>
            <div class="detail-item full-width">
                <label>Produits</label>
                <span>${escapeHtml(item.products)}</span>
            </div>
            <div class="detail-item">
                <label>Quantité</label>
                <span>${item.quantity}</span>
            </div>
            <div class="detail-item">
                <label>Montant</label>
                <span>${formatCurrency(item.amount)}</span>
            </div>
            <div class="detail-item">
                <label>Statut</label>
                <span class="status-badge ${getStatusBadgeClass(item.status)}">${item.status}</span>
            </div>
            <div class="detail-item">
                <label>Paiement</label>
                <span class="status-badge ${getStatusBadgeClass(item.paymentStatus)}">${item.paymentStatus}</span>
            </div>
            <div class="detail-item full-width">
                <label>Adresse de livraison</label>
                <span>${escapeHtml(item.address)}</span>
            </div>
            <div class="detail-item">
                <label>Date de commande</label>
                <span>${formatDate(item.createdAt)}</span>
            </div>
            ${item.notes ? `
                <div class="detail-item full-width">
                    <label>Notes</label>
                    <span>${escapeHtml(item.notes)}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    // Show view modal
    document.getElementById('viewModalOverlay').classList.add('show');
}

/**
 * Edit Order
 * Opens edit modal with pre-filled form data.
 * Admin only function.
 * 
 * @param {number} id - Order ID to edit
 */
function editItem(id) {
    const data = getData('orders') || [];
    const item = data.find(o => o.id === id);
    
    if (!item) {
        showToast('Commande non trouvée', 'error');
        return;
    }
    
    // Set editing state
    editingId = id;
    
    // Update modal title
    document.getElementById('modalTitle').textContent = 'Modifier Commande';
    
    // Fill form fields with existing data
    // NOTE: Using correct HTML element IDs
    document.getElementById('entityId').value = item.id;
    document.getElementById('client').value = item.clientId;
    document.getElementById('product').value = item.products;
    document.getElementById('quantity').value = item.quantity;
    document.getElementById('amount').value = item.amount;
    document.getElementById('status').value = item.status;
    document.getElementById('payment').value = item.paymentStatus;
    document.getElementById('address').value = item.address;
    
    // Optional notes field
    const notesField = document.getElementById('notes');
    if (notesField) notesField.value = item.notes || '';
    
    // Show edit modal
    document.getElementById('modalOverlay').classList.add('show');
}

/**
 * Delete Order
 * Opens delete confirmation modal.
 * Does not actually delete until confirmed.
 * 
 * @param {number} id - Order ID to delete
 */
function deleteItem(id) {
    // Store ID for confirmation
    deleteId = id;
    // Show confirmation modal
    document.getElementById('deleteModalOverlay').classList.add('show');
}

/**
 * Confirm Delete
 * Actually deletes the order after user confirmation.
 * Called when user clicks "Supprimer" in delete modal.
 */
function confirmDelete() {
    if (!deleteId) return;
    
    // Get current data
    let data = getData('orders') || [];
    
    // Filter out the deleted item
    data = data.filter(item => item.id !== deleteId);
    
    // Save updated data
    setData('orders', data);
    
    // Show success message
    showToast('Commande supprimée avec succès', 'success');
    
    // Close modal and refresh
    document.getElementById('deleteModalOverlay').classList.remove('show');
    renderTable();
    
    // Reset delete ID
    deleteId = null;
}

/* ==========================================
 * END OF ORDERS.JS
 * ==========================================
 * 
 * SUMMARY:
 * - State: currentPage, itemsPerPage, currentSort, editingId, deleteId
 * - Init: initOrdersPage(), populateClientSelect(), populateProductSelect()
 * - Table: renderTable(), escapeHtml()
 * - Filters: applyFilters(), initFilters(), handleExportCSV()
 * - Modals: initModal()
 * - CRUD: handleFormSubmit(), viewItem(), editItem(), deleteItem(), confirmDelete()
 * 
 * BUG FIXES:
 * - Fixed form element IDs to match HTML (client, product, payment)
 * - Added null checks for DOM elements
 * - Added XSS protection with escapeHtml()
 * ========================================== */
