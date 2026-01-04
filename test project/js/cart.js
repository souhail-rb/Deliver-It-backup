/* ==========================================
 * GLOVOADMIN - CART MANAGEMENT (cart.js)
 * ==========================================
 * 
 * DESCRIPTION:
 * Manages the shopping cart functionality for the public facing side.
 * Handles adding/removing items, updating quantities, and calculating totals.
 * 
 * FILE STRUCTURE:
 * ─────────────────────────────────────────
 * SECTION 1: INITIALIZATION
 *   - DOMContentLoaded: Entry point
 * 
 * SECTION 2: DATA MANAGEMENT
 *   - getCart(): Retrieve cart from localStorage
 *   - saveCart(): Save cart to localStorage
 * 
 * SECTION 3: RENDER FUNCTION (DISPLAY)
 *   - renderCartPage(): Build HTML for cart items
 * 
 * SECTION 4: CART ACTIONS
 *   - updateQuantity(): Increment/Decrement item count
 *   - removeItem(): Delete item from cart
 * 
 * SECTION 5: SECURITY
 *   - escapeHtml(): XSS prevention
 * 
 * DEPENDENCIES:
 * - localStorage ('cart' key)
 * 
 * @author GlovoAdmin Team
 * @version 1.0.0
 * ========================================== */

/* ------------------------------------------
 * SECTION 1: INITIALIZATION
 * ------------------------------------------
 * Wait for the HTML to finish loading before running any JavaScript.
 * ------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {
    renderCartPage();
});

/* ------------------------------------------
 * SECTION 2: DATA MANAGEMENT
 * ------------------------------------------
 * Helper functions to interact with Local Storage.
 * ------------------------------------------ */

/**
 * Get Cart Data
 * @function getCart
 * @description Helper function to get the cart from the browser's Local Storage.
 * JSON.parse converts the text string back into a JavaScript array.
 * @returns {Array} Array of cart items or empty array if none found.
 */
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

/**
 * Save Cart Data
 * @function saveCart
 * @description Helper function to save the current cart back to Local Storage.
 * JSON.stringify converts the JavaScript array into a text string.
 * @param {Array} cart - The cart array to save.
 */
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    // Re-draw the page to show the updated data
    renderCartPage();
}

/* ------------------------------------------
 * SECTION 3: RENDER FUNCTION (DISPLAY)
 * ------------------------------------------
 * Builds the HTML for the cart items and calculates the total.
 * ------------------------------------------ */

/**
 * Render Cart Page
 * @function renderCartPage
 * @description Generates HTML for all items in the cart and updates the total price.
 * Handles the "Empty Cart" state.
 */
function renderCartPage() {
    const cart = getCart();
    // Get references to the HTML elements where we will inject content
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    const totalEl = document.getElementById('cartTotal');
    
    // CASE 1: The cart is empty
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket fa-4x mb-3 text-light"></i>
                <p>Votre panier est vide.</p>
                <a href="index.html" class="btn btn-primary mt-3">Découvrir nos produits</a>
            </div>
        `;
        // Hide the summary section (total price button)
        summary.style.display = 'none';
        return;
    }

    // CASE 2: The cart has items
    summary.style.display = 'block';
    let total = 0;

    // Loop through each item in the cart to create its HTML
    // .map() transforms the array of data into an array of HTML strings
    container.innerHTML = cart.map((item, index) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQty = item.quantity || 1;
        const itemTotal = itemPrice * itemQty;
        // Add this item's cost to the running total
        total += itemTotal;

        // Return the HTML structure for one cart item
        return `
            <div class="cart-item">
                <div class="cart-item-icon">
                    <i class="fas fa-box fa-2x"></i>
                </div>
                <div class="cart-item-info">
                    <h3 class="cart-item-title">${escapeHtml(item.name)}</h3>
                    <p class="text-muted mb-0">${itemPrice.toFixed(2)} € / unité</p>
                </div>
                <div class="cart-actions">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)" title="Diminuer">-</button>
                    <span class="qty-display">${itemQty}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)" title="Dupliquer / Ajouter">+</button>
                    
                    <span class="price-display">${itemTotal.toFixed(2)} €</span>
                    
                    <button class="remove-btn" onclick="removeItem(${index})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Update the total price text at the bottom
    totalEl.textContent = `Total: ${total.toFixed(2)} €`;
}

/* ------------------------------------------
 * SECTION 4: CART ACTIONS
 * ------------------------------------------
 * Functions called by user interactions (buttons).
 * ------------------------------------------ */

/**
 * Update Item Quantity
 * @function updateQuantity
 * @description Called when clicking + or - buttons.
 * Updates quantity and handles removal if quantity drops below 1.
 * @param {number} index - Index of the item in the cart array.
 * @param {number} change - Amount to change (+1 or -1).
 */
function updateQuantity(index, change) {
    const cart = getCart();
    // Check if the item exists
    if (cart[index]) {
        // Update the quantity (e.g., +1 or -1)
        cart[index].quantity = (cart[index].quantity || 1) + change;
        
        // Logic: If quantity drops below 1, ask to remove the item
        if (cart[index].quantity < 1) {
            if(confirm('Voulez-vous retirer cet article du panier ?')) {
                cart.splice(index, 1); // Remove 1 item at 'index'
            } else {
                cart[index].quantity = 1; // Revert to 1 if cancelled
            }
        }
        // Save changes to storage
        saveCart(cart);
    }
}

/**
 * Remove Item
 * @function removeItem
 * @description Called when clicking the trash icon.
 * Removes the item completely from the cart.
 * @param {number} index - Index of the item to remove.
 */
function removeItem(index) {
    if(confirm('Voulez-vous supprimer cet article ?')) {
        const cart = getCart();
        cart.splice(index, 1);
        saveCart(cart);
    }
}

/* ------------------------------------------
 * SECTION 5: SECURITY
 * ------------------------------------------
 * Helper functions for security.
 * ------------------------------------------ */

/**
 * Escape HTML
 * @function escapeHtml
 * @description Prevents Cross-Site Scripting (XSS) by cleaning text before putting it in HTML.
 * @param {string} text - The text to escape.
 * @returns {string} The escaped text.
 */
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}