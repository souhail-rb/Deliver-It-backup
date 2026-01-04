/* ==========================================
 * GLOVOADMIN - USERS MANAGEMENT (users.js)
 * ==========================================
 * 
 * DESCRIPTION:
 * Manages the system users (Admins, Managers, Drivers, etc.).
 * Allows viewing, filtering, adding, editing, and deleting users.
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
 *   - renderUsersTable(): Display users with filters
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
 *   - editUser(): Trigger edit mode
 *   - deleteUser(): Remove user
 * 
 * DEPENDENCIES:
 * - localStorage ('users' key)
 * 
 * @author GlovoAdmin Team
 * @version 1.0.0
 * ========================================== */

/* ------------------------------------------
 * SECTION 1: INITIALIZATION
 * ------------------------------------------
 * Entry point for the users page.
 * ------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {
    renderUsersTable();
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
 * Displays the list of users based on current filters.
 * ------------------------------------------ */

/**
 * Render Users Table
 * @function renderUsersTable
 * @description Filters and displays users in the table.
 * Handles search, role filter, and status filter.
 */
function renderUsersTable() {
    const users = getData('users');
    const tbody = document.getElementById('tableBody');
    
    // Get filter values
    const search = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;
    const statusFilter = document.getElementById('filterStatus').value;

    // Apply filters
    const filtered = users.filter(user => {
        const matchSearch = (user.name || '').toLowerCase().includes(search) || 
                          (user.email || '').toLowerCase().includes(search);
        const matchRole = !roleFilter || user.role === roleFilter;
        const matchStatus = !statusFilter || user.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
    });

    // Generate HTML
    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td>#${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="status-badge info">${user.role}</span></td>
            <!-- Conditional styling: Green if Active, Red if not -->
            <td><span class="status-badge ${user.status === 'Actif' ? 'success' : 'danger'}">${user.status}</span></td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editUser(${user.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('paginationInfo').textContent = `Affichage ${filtered.length} utilisateurs`;
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
    
    document.getElementById('searchInput').addEventListener('input', renderUsersTable);
    document.getElementById('filterRole').addEventListener('change', renderUsersTable);
    document.getElementById('filterStatus').addEventListener('change', renderUsersTable);
    
    // Close modal on outside click
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalOverlay')) closeModal();
    });
}

/* ------------------------------------------
 * SECTION 5: MODAL LOGIC
 * ------------------------------------------
 * Handles opening and closing of the add/edit modal.
 * ------------------------------------------ */

/**
 * Open Modal
 * @function openModal
 * @description Opens the form for Adding (user=null) or Editing (user=object).
 * @param {Object|null} user - User object to edit, or null for new user.
 */
function openModal(user = null) {
    const modal = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('entityForm');
    
    if (user) {
        // Edit Mode
        title.textContent = 'Modifier Utilisateur';
        document.getElementById('entityId').value = user.id;
        document.getElementById('name').value = user.name;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.role;
        document.getElementById('status').value = user.status;
        document.getElementById('phone').value = user.phone || '';
    } else {
        // Add Mode
        title.textContent = 'Ajouter Utilisateur';
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
 * Handles creating or updating user data.
 * ------------------------------------------ */

/**
 * Handle Form Submit
 * @function handleFormSubmit
 * @description Processes the form submission for creating or updating a user.
 * @param {Event} e - The submit event.
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const users = getData('users');
    const id = document.getElementById('entityId').value;
    
    const userData = {
        id: id ? parseInt(id) : generateId('users'),
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value,
        status: document.getElementById('status').value,
        phone: document.getElementById('phone').value,
        // Keep original creation date if editing, else use now
        createdAt: id ? users.find(u => u.id == id).createdAt : new Date().toISOString()
    };

    if (id) {
        const index = users.findIndex(u => u.id == id);
        users[index] = userData;
    } else {
        users.push(userData);
    }

    saveData('users', users);
    closeModal();
    renderUsersTable();
}

/* ------------------------------------------
 * SECTION 7: GLOBAL HELPERS
 * ------------------------------------------
 * Functions attached to window for HTML onclick access.
 * ------------------------------------------ */

/**
 * Edit User
 * @function editUser
 * @description Global function to trigger edit mode for a user.
 * @param {number} id - The ID of the user to edit.
 */
window.editUser = function(id) {
    const users = getData('users');
    const user = users.find(u => u.id === id);
    if (user) openModal(user);
};

/**
 * Delete User
 * @function deleteUser
 * @description Global function to delete a user.
 * @param {number} id - The ID of the user to delete.
 */
window.deleteUser = function(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        const users = getData('users');
        const newUsers = users.filter(u => u.id !== id);
        saveData('users', newUsers);
        renderUsersTable();
    }
};
