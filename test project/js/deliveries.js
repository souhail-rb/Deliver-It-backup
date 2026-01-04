/* ==========================================
 * GLOVOADMIN - DELIVERIES MANAGEMENT (deliveries.js)
 * ==========================================
 * 
 * DESCRIPTION:
 * Manages the delivery tracking system.
 * Allows assigning drivers to orders and tracking status.
 * 
 * FILE STRUCTURE:
 * ─────────────────────────────────────────
 * SECTION 1: INITIALIZATION
 *   - DOMContentLoaded: Entry point
 * 
 * SECTION 2: DATA HELPERS
 *   - getData(): Retrieve data from localStorage
 *   - saveData(): Save data to localStorage
 * 
 * SECTION 3: RENDER TABLE
 *   - renderDeliveriesTable(): Display deliveries with filters
 *   - getStatusBadgeClass(): Color coding for statuses
 * 
 * SECTION 4: EVENT LISTENERS
 *   - setupEventListeners(): Bind UI events
 * 
 * SECTION 5: MODAL LOGIC
 *   - openModal(): Show add/edit form with dynamic dropdowns
 *   - closeModal(): Hide form
 * 
 * SECTION 6: FORM SUBMISSION
 *   - handleFormSubmit(): Process create/update
 * 
 * SECTION 7: GLOBAL HELPERS
 *   - editDelivery(): Trigger edit mode
 *   - deleteDelivery(): Remove delivery
 * 
 * DEPENDENCIES:
 * - localStorage ('deliveries', 'orders', 'users' keys)
 * 
 * @author GlovoAdmin Team
 * @version 1.0.0
 * ========================================== */

/* ------------------------------------------
 * SECTION 1: INITIALIZATION
 * ------------------------------------------
 * Entry point for the deliveries page.
 * ------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {
    renderDeliveriesTable();
    setupEventListeners();
});

/* ------------------------------------------
 * SECTION 2: DATA HELPERS
 * ------------------------------------------
 * Wrappers for LocalStorage interaction.
 * ------------------------------------------ */

/**
 * Get Data from Storage
 * @param {string} key - LocalStorage key
 * @returns {Array} Parsed data or empty array
 */
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

/**
 * Save Data to Storage
 * @param {string} key - LocalStorage key
 * @param {Array} data - Data to save
 */
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/* ------------------------------------------
 * SECTION 3: RENDER TABLE
 * ------------------------------------------
 * Displays the list of deliveries based on current filters.
 * ------------------------------------------ */

/**
 * Render Deliveries Table
 * @function renderDeliveriesTable
 * @description Filters and displays deliveries in the table.
 * Handles search, status filter, and driver filter.
 * Dynamically populates the driver filter dropdown if empty.
 */
function renderDeliveriesTable() {
    const deliveries = getData('deliveries');
    const tbody = document.getElementById('tableBody');
    const search = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const driverFilter = document.getElementById('filterDriver').value;

    // DYNAMIC FILTER POPULATION
    // If the driver dropdown is empty (length <= 1), fill it with drivers from 'users' data
    const driverSelect = document.getElementById('filterDriver');
    if (driverSelect.options.length <= 1) {
        const users = getData('users');
        // Find only users who are 'Livreur' (Driver)
        const drivers = users.filter(u => u.role === 'Livreur');
        drivers.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.name;
            opt.textContent = d.name;
            driverSelect.appendChild(opt);
        });
    }

    // FILTER LOGIC
    const filtered = deliveries.filter(delivery => {
        const matchSearch = (delivery.address || '').toLowerCase().includes(search) || 
                          (delivery.orderId || '').toString().includes(search);
        const matchStatus = !statusFilter || delivery.status === statusFilter;
        const matchDriver = !driverFilter || delivery.driver === driverFilter;
        return matchSearch && matchStatus && matchDriver;
    });

    tbody.innerHTML = filtered.map(delivery => `
        <tr>
            <td>#${delivery.id}</td>
            <td>#${delivery.orderId}</td>
            <td>${delivery.driver}</td>
            <td>${delivery.address}</td>
            <td><span class="status-badge ${getStatusBadgeClass(delivery.status)}">${delivery.status}</span></td>
            <td>${new Date(delivery.date).toLocaleDateString()}</td>
            <td>${delivery.duration} min</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editDelivery(${delivery.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteDelivery(${delivery.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('paginationInfo').textContent = `Affichage ${filtered.length} livraisons`;
}

/**
 * Get Status Badge Class
 * @function getStatusBadgeClass
 * @description Maps delivery status to CSS class for styling.
 * @param {string} status - The delivery status.
 * @returns {string} CSS class name.
 */
function getStatusBadgeClass(status) {
    switch(status) {
        case 'Livrée': return 'success';
        case 'En cours': return 'info';
        case 'En attente': return 'warning';
        case 'Échec': return 'danger';
        default: return 'secondary';
    }
}

/* ------------------------------------------
 * SECTION 4: EVENT LISTENERS
 * ------------------------------------------
 * Connects buttons and inputs to their JavaScript functions.
 * ------------------------------------------ */

/**
 * Setup Event Listeners
 * @function setupEventListeners
 * @description Binds click, input, and submit events to UI elements.
 */
function setupEventListeners() {
    document.getElementById('addNewBtn').addEventListener('click', () => openModal());
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('entityForm').addEventListener('submit', handleFormSubmit);
    
    document.getElementById('searchInput').addEventListener('input', renderDeliveriesTable);
    document.getElementById('filterStatus').addEventListener('change', renderDeliveriesTable);
    document.getElementById('filterDriver').addEventListener('change', renderDeliveriesTable);
    
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalOverlay')) closeModal();
    });
}

/* ------------------------------------------
 * SECTION 5: MODAL WITH DYNAMIC DROPDOWNS
 * ------------------------------------------
 * Handles opening and closing of the add/edit modal.
 * Populates dropdowns with data from other entities (orders, users).
 * ------------------------------------------ */

/**
 * Open Modal
 * @function openModal
 * @description Opens the form for Adding (delivery=null) or Editing (delivery=object).
 * Populates 'orders' and 'drivers' dropdowns dynamically.
 * @param {Object|null} delivery - Delivery object to edit, or null for new delivery.
 */
function openModal(delivery = null) {
    const modal = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('entityForm');
    
    // LOAD DATA FOR DROPDOWNS
    // We need 'orders' to select which order to deliver
    // We need 'users' to select which driver will take it
    const orders = getData('orders');
    const users = getData('users');
    const drivers = users.filter(u => u.role === 'Livreur');
    
    const orderSelect = document.getElementById('orderId');
    const driverSelect = document.getElementById('driver');
    
    // POPULATE ORDERS DROPDOWN
    orderSelect.innerHTML = '<option value="">Sélectionner une commande</option>';
    
    // Sort orders by client name to help find clients
    orders.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''));

    orders.forEach(order => {
        const option = document.createElement('option');
        option.value = order.id;
        // Display Client Name first, remove "Cmd" prefix
        option.textContent = `${order.clientName || 'Client Inconnu'} - Commande #${order.id} (${order.amount}€)`;
        // Pre-select if editing
        if (delivery && delivery.orderId == order.id) option.selected = true;
        orderSelect.appendChild(option);
    });

    // POPULATE DRIVERS DROPDOWN
    driverSelect.innerHTML = '<option value="">Sélectionner un livreur</option>';
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.name;
        option.textContent = driver.name;
        if (delivery && delivery.driver === driver.name) option.selected = true;
        driverSelect.appendChild(option);
    });
    
    if (delivery) {
        title.textContent = 'Modifier Livraison';
        document.getElementById('entityId').value = delivery.id;
        document.getElementById('status').value = delivery.status;
        document.getElementById('duration').value = delivery.duration;
        document.getElementById('address').value = delivery.address;
        document.getElementById('notes').value = delivery.notes || '';
    } else {
        title.textContent = 'Nouvelle Livraison';
        form.reset();
        document.getElementById('entityId').value = '';
    }
    
    modal.classList.add('show');
}

/**
 * Close Modal
 * @function closeModal
 * @description Hides the modal overlay.
 */
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
}

/* ------------------------------------------
 * SECTION 6: FORM SUBMISSION
 * ------------------------------------------
 * Handles creating or updating delivery data.
 * ------------------------------------------ */

/**
 * Handle Form Submit
 * @function handleFormSubmit
 * @description Processes the form submission for creating or updating a delivery.
 * @param {Event} e - The submit event.
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const deliveries = getData('deliveries');
    const id = document.getElementById('entityId').value;
    
    const deliveryData = {
        id: id ? parseInt(id) : generateId('deliveries'),
        orderId: document.getElementById('orderId').value,
        driver: document.getElementById('driver').value,
        status: document.getElementById('status').value,
        duration: document.getElementById('duration').value,
        address: document.getElementById('address').value,
        notes: document.getElementById('notes').value,
        date: id ? deliveries.find(d => d.id == id).date : new Date().toISOString()
    };

    if (id) {
        const index = deliveries.findIndex(d => d.id == id);
        deliveries[index] = deliveryData;
    } else {
        deliveries.push(deliveryData);
    }

    saveData('deliveries', deliveries);
    closeModal();
    renderDeliveriesTable();
}

/* ------------------------------------------
 * SECTION 7: GLOBAL HELPERS
 * ------------------------------------------
 * Functions attached to window for HTML onclick access.
 * ------------------------------------------ */

/**
 * Edit Delivery
 * @function editDelivery
 * @description Global function to trigger edit mode for a delivery.
 * @param {number} id - The ID of the delivery to edit.
 */
window.editDelivery = function(id) {
    const deliveries = getData('deliveries');
    const delivery = deliveries.find(d => d.id === id);
    if (delivery) openModal(delivery);
};

/**
 * Delete Delivery
 * @function deleteDelivery
 * @description Global function to delete a delivery.
 * @param {number} id - The ID of the delivery to delete.
 */
window.deleteDelivery = function(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette livraison ?')) {
        const deliveries = getData('deliveries');
        const newDeliveries = deliveries.filter(d => d.id !== id);
        saveData('deliveries', newDeliveries);
        renderDeliveriesTable();
    }
};
