/* ==========================================
 * GLOVOADMIN - CLIENTS MANAGEMENT (clients.js)
 * ==========================================
 * 
 * DESCRIPTION:
 * Manages the clients/customers section of the application.
 * Allows viewing, filtering, adding, editing, and deleting clients.
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
 *   - renderClientsTable(): Display clients with filters
 * 
 * SECTION 4: EVENT LISTENERS
 *   - setupEventListeners(): Bind UI events
 * 
 * SECTION 5: MODAL LOGIC
 *   - openModal(): Show add/edit form
 *   - closeModal(): Hide form
 * 
 * SECTION 6: FORM SUBMISSION
 *   - handleFormSubmit(): Process create/update
 * 
 * SECTION 7: GLOBAL HELPERS
 *   - editClient(): Trigger edit mode
 *   - deleteClient(): Remove client
 * 
 * DEPENDENCIES:
 * - localStorage ('clients' key)
 * 
 * @author GlovoAdmin Team
 * @version 1.0.0
 * ========================================== */

/* ------------------------------------------
 * SECTION 1: INITIALIZATION
 * ------------------------------------------
 * Entry point for the clients page.
 * ------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {
    renderClientsTable();
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
 * Displays the list of clients based on current filters.
 * ------------------------------------------ */

/**
 * Render Clients Table
 * @function renderClientsTable
 * @description Filters and displays clients in the table.
 * Handles search, city filter, and type filter.
 */
function renderClientsTable() {
    const clients = getData('clients');
    const tbody = document.getElementById('tableBody');
    
    // Get current values from the search bar and dropdown filters
    const search = document.getElementById('searchInput').value.toLowerCase();
    const cityFilter = document.getElementById('filterCity').value;
    const typeFilter = document.getElementById('filterType').value;

    // Filter the data array based on the inputs
    const filtered = clients.filter(client => {
        // Check if name OR email matches the search text
        const matchSearch = (client.name || '').toLowerCase().includes(search) || 
                          (client.email || '').toLowerCase().includes(search);
        // Check if city matches (or if filter is empty)
        const matchCity = !cityFilter || client.city === cityFilter;
        // Check if type matches (or if filter is empty)
        const matchType = !typeFilter || client.type === typeFilter;
        
        // Return true only if ALL conditions are met
        return matchSearch && matchCity && matchType;
    });

    // Convert the filtered data into HTML table rows
    tbody.innerHTML = filtered.map(client => `
        <tr>
            <td>#${client.id}</td>
            <td>${client.name}</td>
            <td>${client.email}</td>
            <td>${client.phone || '-'}</td>
            <td>${client.city || '-'}</td>
            <td><span class="status-badge info">${client.type}</span></td>
            <td>${client.orders || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editClient(${client.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteClient(${client.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Update the counter text at the bottom
    document.getElementById('paginationInfo').textContent = `Affichage ${filtered.length} clients`;
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
    
    // Re-render table whenever user types or changes a filter
    document.getElementById('searchInput').addEventListener('input', renderClientsTable);
    document.getElementById('filterCity').addEventListener('change', renderClientsTable);
    document.getElementById('filterType').addEventListener('change', renderClientsTable);
    
    // Close modal if clicking on the dark background overlay
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalOverlay')) closeModal();
    });
}

/* ------------------------------------------
 * SECTION 5: MODAL (POPUP) LOGIC
 * ------------------------------------------
 * Handles opening and closing of the add/edit modal.
 * ------------------------------------------ */

/**
 * Open Modal
 * @function openModal
 * @description Opens the form for Adding (client=null) or Editing (client=object).
 * @param {Object|null} client - Client object to edit, or null for new client.
 */
function openModal(client = null) {
    const modal = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('entityForm');
    
    if (client) {
        // EDIT MODE: Fill the form with existing data
        title.textContent = 'Modifier Client';
        document.getElementById('entityId').value = client.id;
        document.getElementById('name').value = client.name;
        document.getElementById('email').value = client.email;
        document.getElementById('phone').value = client.phone;
        document.getElementById('type').value = client.type;
        document.getElementById('city').value = client.city;
        document.getElementById('orders').value = client.orders || 0;
        document.getElementById('address').value = client.address || '';
    } else {
        // ADD MODE: Clear the form
        title.textContent = 'Ajouter Client';
        form.reset();
        document.getElementById('entityId').value = '';
    }
    
    // Show the modal via CSS class
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
 * Handles creating or updating client data.
 * ------------------------------------------ */

/**
 * Handle Form Submit
 * @function handleFormSubmit
 * @description Processes the form submission for creating or updating a client.
 * @param {Event} e - The submit event.
 */
function handleFormSubmit(e) {
    // Prevent page reload
    e.preventDefault();
    const clients = getData('clients');
    // Check if we have a hidden ID (Edit mode) or not (Add mode)
    const id = document.getElementById('entityId').value;
    
    // Create the client object from form values
    const clientData = {
        // If ID exists, keep it. If not, generate a new one.
        id: id ? parseInt(id) : generateId('clients'),
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        type: document.getElementById('type').value,
        city: document.getElementById('city').value,
        orders: parseInt(document.getElementById('orders').value) || 0,
        address: document.getElementById('address').value
    };

    if (id) {
        // UPDATE: Find index and replace
        const index = clients.findIndex(c => c.id == id);
        clients[index] = clientData;
    } else {
        // CREATE: Add to end of array
        clients.push(clientData);
    }

    // Save and refresh
    saveData('clients', clients);
    closeModal();
    renderClientsTable();
}

/* ------------------------------------------
 * SECTION 7: GLOBAL HELPERS
 * ------------------------------------------
 * Functions attached to window for HTML onclick access.
 * ------------------------------------------ */

/**
 * Edit Client
 * @function editClient
 * @description Global function to trigger edit mode for a client.
 * @param {number} id - The ID of the client to edit.
 */
window.editClient = function(id) {
    const clients = getData('clients');
    const client = clients.find(c => c.id === id);
    if (client) openModal(client);
};

/**
 * Delete Client
 * @function deleteClient
 * @description Global function to delete a client.
 * @param {number} id - The ID of the client to delete.
 */
window.deleteClient = function(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
        const clients = getData('clients');
        // Filter out the client with the matching ID
        const newClients = clients.filter(c => c.id !== id);
        saveData('clients', newClients);
        renderClientsTable();
    }
};