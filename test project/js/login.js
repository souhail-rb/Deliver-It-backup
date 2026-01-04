/* ==========================================
 * GLOVOADMIN - LOGIN MANAGEMENT (login.js)
 * ==========================================
 * 
 * DESCRIPTION:
 * Manages the authentication process for the admin panel.
 * Handles form submission, validation, and redirection.
 * 
 * FILE STRUCTURE:
 * ─────────────────────────────────────────
 * SECTION 1: EVENT LISTENERS
 *   - Form Submit: Handle login attempt
 * 
 * DEPENDENCIES:
 * - localStorage ('user' key)
 * 
 * @author GlovoAdmin Team
 * @version 1.0.0
 * ========================================== */

/* ------------------------------------------
 * SECTION 1: EVENT LISTENERS
 * ------------------------------------------
 * Handle the login form submission.
 * ------------------------------------------ */

/**
 * Login Form Submit Handler
 * @description Listens for the 'submit' event on the form with ID 'loginForm'.
 * Validates credentials and redirects to dashboard on success.
 */
document.getElementById('loginForm').addEventListener('submit', function(e) {
    // Prevent the browser from reloading the page (default form behavior)
    e.preventDefault();
    
    // Get the values typed by the user
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple mock authentication check
    // In a real app, this would send data to a server
    if (email === 'admin@app.com' && password === 'admin123') {
        // Success: Save user info to Local Storage so other pages know we are logged in
        localStorage.setItem('user', JSON.stringify({name: 'Admin', role: 'admin', email: email}));
        // Redirect to the dashboard
        window.location.href = 'dashboard.html';
    } else {
        // Failure: Show error message
        const errorMsg = document.getElementById('errorMessage');
        errorMsg.textContent = 'Identifiants incorrects. Essayez admin@app.com / admin123';
        errorMsg.style.display = 'block';
    }
});