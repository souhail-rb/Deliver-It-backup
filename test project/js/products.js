/* ==========================================
 * GlovoAdmin - Products Management JavaScript
 * ==========================================
 * 
 * PURPOSE:
 * Manages all product-related operations:
 * - Display products in sortable, paginated table
 * - Create new products
 * - View product details
 * - Edit existing products (Admin only)
 * - Delete products (Admin only)
 * - Filter by category and availability
 * - Export products to CSV
 * 
 * DEPENDENCIES:
 * - script.js (core functions)
 * 
 * AUTHOR: GlovoAdmin Team
 * VERSION: 2.0.0 (Optimized)
 * ========================================== */

/* ------------------------------------------
 * SECTION 1: STATE VARIABLES
 * ------------------------------------------
 */

/** @type {number} Current page (1-indexed) */
let currentPage = 1;

/** @type {number} Items per page */
let itemsPerPage = 10;

/** @type {Object} Sort configuration {column, direction} */
let currentSort = { column: 'id', direction: 'asc' };

/** @type {number|null} ID being edited */
let editingId = null;

/** @type {number|null} ID pending deletion */
let deleteId = null;

/* ------------------------------------------
 * SECTION 2: INITIALIZATION
 * ------------------------------------------
 */

/**
 * DOM Ready Handler
 * Initializes page after authentication check.
 */
document.addEventListener('DOMContentLoaded', () => {
    if (!initAuth()) return;
    initProductsPage();
});

/**
 * Initialize Products Page
 * Sets up all components.
 */
function initProductsPage() {
    populateCategoryFilter();
    renderTable();
    initFilters();
    initModal();
    initTableSorting('dataTable', (sort) => {
        currentSort = sort;
        renderTable();
    });
}

/**
 * Populate Category Filter
 * Dynamically creates options from existing products.
 */
function populateCategoryFilter() {
    const products = getData('products') || [];
    const filterCategory = document.getElementById('filterCategory');
    if (!filterCategory) return;
    
    // Get unique categories using Set
    // 1. map() creates array of just category names
    // 2. Set() removes duplicates
    // 3. [...] spreads it back into an array
    const categories = [...new Set(products.map(p => p.category))];
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterCategory.appendChild(option);
    });
}

/* ------------------------------------------
 * SECTION 3: TABLE RENDERING
 * ------------------------------------------
 */

/**
 * Render Products Table
 * Displays filtered, sorted, paginated products.
 */
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    // 1. Get Data
    let data = getData('products') || [];
    // 2. Filter Data
    data = applyFilters(data);
    
    // 3. Sort Data
    if (currentSort.column) {
        data = sortData(data, currentSort.column, currentSort.direction);
    }
    
    // 4. Paginate Data (Slice the array)
    const totalItems = data.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);
    
    // Admin check for edit/delete buttons
    const isAdmin = window.currentUserRole === 'admin';
    
    // 5. Generate HTML
    tableBody.innerHTML = paginatedData.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${escapeHtml(product.name)}</td>
            <td>${product.category}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>${escapeHtml(product.supplier)}</td>
            <td>
                <span class="status-badge ${product.available ? 'success' : 'danger'}">
                    ${product.available ? 'Disponible' : 'Indisponible'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewItem(${product.id})" title="Voir">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${isAdmin ? `
                        <button class="action-btn edit" onclick="editItem(${product.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteItem(${product.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
    
    // Empty state
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-box"></i>
                    <h3>Aucun produit trouvé</h3>
                    <p>Ajoutez un nouveau produit ou modifiez vos filtres</p>
                </td>
            </tr>
        `;
    }
    
    // 6. Update Pagination Controls
    createPagination(totalItems, currentPage, itemsPerPage, (page) => {
        currentPage = page;
        renderTable();
    });
}

/**
 * Escape HTML for XSS prevention
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ------------------------------------------
 * SECTION 4: FILTERS
 * ------------------------------------------
 */

/**
 * Apply Filters
 * Filters by search, category, availability.
 */
function applyFilters(data) {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filterCategory')?.value || '';
    const availabilityFilter = document.getElementById('filterAvailability')?.value || '';
    
    return data.filter(item => {
        // Search: Check name OR supplier
        const matchesSearch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm) ||
            item.supplier.toLowerCase().includes(searchTerm);
        // Category: Exact match
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        // Availability: Boolean check
        const matchesAvailability = availabilityFilter === '' || 
            item.available === (availabilityFilter === 'true');
        
        return matchesSearch && matchesCategory && matchesAvailability;
    });
}

/**
 * Initialize Filters
 * Sets up event listeners for all filter controls.
 */
function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const filterAvailability = document.getElementById('filterAvailability');
    const rowsPerPage = document.getElementById('rowsPerPage');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    
    // Debounce: Wait 300ms after typing stops before filtering
    searchInput?.addEventListener('input', debounce(() => {
        currentPage = 1;
        renderTable();
    }, 300));
    
    filterCategory?.addEventListener('change', () => {
        currentPage = 1;
        renderTable();
    });
    
    filterAvailability?.addEventListener('change', () => {
        currentPage = 1;
        renderTable();
    });
    
    rowsPerPage?.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        renderTable();
    });
    
    exportCsvBtn?.addEventListener('click', () => {
        const data = getData('products') || [];
        exportToCSV(data, 'produits', ['ID', 'Nom', 'Catégorie', 'Prix', 'Stock', 'Fournisseur', 'Disponible']);
        showToast('Export CSV réussi', 'success');
    });
}

/* ------------------------------------------
 * SECTION 5: MODAL HANDLING
 * ------------------------------------------
 */

/**
 * Initialize Modals
 * Sets up add/edit, view, and delete modals.
 */
function initModal() {
    const addNewBtn = document.getElementById('addNewBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const entityForm = document.getElementById('entityForm');
    
    const viewModalOverlay = document.getElementById('viewModalOverlay');
    const viewModalClose = document.getElementById('viewModalClose');
    const closeViewBtn = document.getElementById('closeViewBtn');
    
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    const deleteModalClose = document.getElementById('deleteModalClose');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Open add modal
    addNewBtn?.addEventListener('click', () => {
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Nouveau Produit';
        entityForm?.reset();
        modalOverlay?.classList.add('show');
    });
    
    // Close handlers
    modalClose?.addEventListener('click', () => modalOverlay?.classList.remove('show'));
    cancelBtn?.addEventListener('click', () => modalOverlay?.classList.remove('show'));
    viewModalClose?.addEventListener('click', () => viewModalOverlay?.classList.remove('show'));
    closeViewBtn?.addEventListener('click', () => viewModalOverlay?.classList.remove('show'));
    deleteModalClose?.addEventListener('click', () => deleteModalOverlay?.classList.remove('show'));
    cancelDeleteBtn?.addEventListener('click', () => deleteModalOverlay?.classList.remove('show'));
    
    // Overlay click close
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('show');
    });
    viewModalOverlay?.addEventListener('click', (e) => {
        if (e.target === viewModalOverlay) viewModalOverlay.classList.remove('show');
    });
    deleteModalOverlay?.addEventListener('click', (e) => {
        if (e.target === deleteModalOverlay) deleteModalOverlay.classList.remove('show');
    });
    
    entityForm?.addEventListener('submit', handleFormSubmit);
    confirmDeleteBtn?.addEventListener('click', confirmDelete);
}

/* ------------------------------------------
 * SECTION 6: CRUD OPERATIONS
 * ------------------------------------------
 */

/**
 * Handle Form Submit
 * Creates or updates product.
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        name: document.getElementById('name').value.trim(),
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        stock: parseInt(document.getElementById('stock').value, 10),
        supplier: document.getElementById('supplier').value.trim(),
        available: document.getElementById('availability').value === 'Disponible'
    };
    
    // Validation
    if (!formData.name || !formData.category || isNaN(formData.price)) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    let data = getData('products') || [];
    
    if (editingId) {
        // Update existing
        const index = data.findIndex(item => item.id === editingId);
        if (index !== -1) {
            data[index] = { ...data[index], ...formData };
            showToast('Produit mis à jour avec succès', 'success');
        }
    } else {
        // Create new
        formData.id = generateId('products');
        data.push(formData);
        showToast('Produit ajouté avec succès', 'success');
    }
    
    setData('products', data);
    document.getElementById('modalOverlay')?.classList.remove('show');
    renderTable();
}

/**
 * View Product Details
 */
function viewItem(id) {
    const data = getData('products') || [];
    const item = data.find(p => p.id === id);
    
    if (!item) {
        showToast('Produit non trouvé', 'error');
        return;
    }
    
    const viewModalBody = document.getElementById('viewModalBody');
    viewModalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <label>ID</label>
                <span>${item.id}</span>
            </div>
            <div class="detail-item">
                <label>Nom</label>
                <span>${escapeHtml(item.name)}</span>
            </div>
            <div class="detail-item">
                <label>Catégorie</label>
                <span>${item.category}</span>
            </div>
            <div class="detail-item">
                <label>Prix</label>
                <span>${formatCurrency(item.price)}</span>
            </div>
            <div class="detail-item">
                <label>Stock</label>
                <span>${item.stock} unités</span>
            </div>
            <div class="detail-item">
                <label>Fournisseur</label>
                <span>${escapeHtml(item.supplier)}</span>
            </div>
            <div class="detail-item full-width">
                <label>Disponibilité</label>
                <span class="status-badge ${item.available ? 'success' : 'danger'}">
                    ${item.available ? 'Disponible' : 'Indisponible'}
                </span>
            </div>
        </div>
    `;
    document.getElementById('viewModalOverlay')?.classList.add('show');
}

/**
 * Edit Product
 */
function editItem(id) {
    const data = getData('products') || [];
    const item = data.find(p => p.id === id);
    
    if (!item) {
        showToast('Produit non trouvé', 'error');
        return;
    }
    
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Modifier Produit';
    document.getElementById('entityId').value = item.id;
    document.getElementById('name').value = item.name;
    document.getElementById('category').value = item.category;
    document.getElementById('price').value = item.price;
    document.getElementById('stock').value = item.stock;
    document.getElementById('supplier').value = item.supplier || '';
    document.getElementById('availability').value = item.available ? 'Disponible' : 'Rupture';
    document.getElementById('modalOverlay')?.classList.add('show');
}

/**
 * Delete Product - Opens confirmation
 */
function deleteItem(id) {
    deleteId = id;
    document.getElementById('deleteModalOverlay')?.classList.add('show');
}

/**
 * Confirm Delete
 */
function confirmDelete() {
    if (!deleteId) return;
    
    let data = getData('products') || [];
    data = data.filter(item => item.id !== deleteId);
    setData('products', data);
    
    showToast('Produit supprimé avec succès', 'success');
    document.getElementById('deleteModalOverlay')?.classList.remove('show');
    renderTable();
    deleteId = null;
}

/* ==========================================
 * END OF PRODUCTS.JS
 * ==========================================
 * 
 * SUMMARY:
 * - Full CRUD for product management
 * - Filter by category, availability, search
 * - Sortable columns, pagination
 * - Admin-only edit/delete
 * - CSV export
 * ========================================== */
