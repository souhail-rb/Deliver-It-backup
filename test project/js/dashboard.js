/* ==========================================
 * GLOVOADMIN - DASHBOARD JAVASCRIPT (dashboard.js)
 * ==========================================
 * 
 * DESCRIPTION:
 * Dashboard page displaying KPIs and charts.
 * Uses Chart.js library for data visualization.
 * 
 * FILE STRUCTURE:
 * ─────────────────────────────────────────
 * SECTION 1: INITIALIZATION
 *   - DOMContentLoaded: Entry point
 *   - initDashboard(): Master init function
 * 
 * SECTION 2: KPIs UPDATE
 *   - updateKPIs(): Calculate and display metrics
 * 
 * SECTION 3: CHARTS INITIALIZATION
 *   - initCharts(): Initialize all chart instances
 * 
 * SECTION 4: INDIVIDUAL CHARTS
 *   - createOrdersChart(): Orders per day (Line)
 *   - createStatusChart(): Order status (Doughnut)
 *   - createRevenueChart(): Revenue trend (Bar)
 *   - createCategoriesChart(): Products by category (Pie)
 *   - createDeliveryChart(): Driver performance (Horizontal Bar)
 * 
 * SECTION 5: RECENT ORDERS TABLE
 *   - renderRecentOrders(): Display latest orders
 * 
 * DEPENDENCIES:
 * - script.js (getData, formatCurrency, formatDate, getStatusBadgeClass)
 * - Chart.js (loaded via CDN in dashboard.html)
 * 
 * DATA SOURCES:
 * - LocalStorage: users, orders, clients, products, deliveries
 * 
 * @author GlovoAdmin Team
 * @version 1.0.0
 * ========================================== */

/* ------------------------------------------
 * SECTION 1: INITIALIZATION
 * ------------------------------------------
 * Dashboard entry point with slight delay
 * to ensure script.js has initialized first.
 * ------------------------------------------ */

/**
 * DOMContentLoaded Event Handler
 * @description Waits 100ms for script.js to initialize
 * sample data before rendering dashboard.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure script.js has initialized
    setTimeout(() => {
        initDashboard();
    }, 100);
});

/**
 * Initialize Dashboard
 * @function initDashboard
 * @description Master initialization function.
 * Calls all dashboard components in sequence.
 */
function initDashboard() {
    updateKPIs();
    initCharts();
    renderRecentOrders();
}

/* ------------------------------------------
 * SECTION 2: KPIs UPDATE
 * ------------------------------------------
 * Key Performance Indicators displayed in
 * stat cards at top of dashboard.
 * ------------------------------------------ */

/**
 * Update KPI Cards
 * @function updateKPIs
 * @description Calculates and displays:
 * - Total Users count
 * - Total Orders count
 * - Total Revenue (excluding cancelled)
 * - Pending Orders count
 */
function updateKPIs() {
    const users = getData('users') || [];
    const orders = getData('orders') || [];
    
    // Total Users - display count
    const totalUsersEl = document.getElementById('totalUsers');
    if (totalUsersEl) {
        totalUsersEl.textContent = users.length;
    }
    
    // Total Orders - display count
    const totalOrdersEl = document.getElementById('totalOrders');
    if (totalOrdersEl) {
        totalOrdersEl.textContent = orders.length;
    }
    
    // Total Revenue - sum of non-cancelled orders
    // .reduce() accumulates a single value (sum) from the array
    const totalRevenue = orders
        .filter(o => o.status !== 'Annulée')
        .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
        totalRevenueEl.textContent = formatCurrency(totalRevenue);
    }
    
    // Pending Orders - orders with "En attente" status
    const pendingOrders = orders.filter(o => o.status === 'En attente').length;
    const pendingOrdersEl = document.getElementById('pendingOrders');
    if (pendingOrdersEl) {
        pendingOrdersEl.textContent = pendingOrders;
    }
}

/* ------------------------------------------
 * SECTION 3: CHARTS INITIALIZATION
 * ------------------------------------------
 * Initializes all Chart.js instances.
 * ------------------------------------------ */

/**
 * Initialize All Charts
 * @function initCharts
 * @description Creates all dashboard chart instances.
 */
function initCharts() {
    createOrdersChart();
    createStatusChart();
    createRevenueChart();
    createCategoriesChart();
    createDeliveryChart();
}

/* ------------------------------------------
 * SECTION 4: INDIVIDUAL CHARTS
 * ------------------------------------------
 * Each function creates a specific chart type
 * using Chart.js library.
 * ------------------------------------------ */

/**
 * Chart 1: Orders Per Day (Line Chart)
 * @function createOrdersChart
 * @description Line chart showing order trend over last 7 days.
 * Uses sample data for demonstration.
 * 
 * Chart Config:
 * - Type: Line with area fill
 * - Color: Brand yellow (#ffc244)
 * - Tension: 0.4 for smooth curves
 */
function createOrdersChart() {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    const orders = getData('orders') || [];
    
    // Generate last 7 days labels
    // Logic: Create an array of the last 7 dates to use as X-axis labels
    const ordersByDate = {};
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        ordersByDate[dateStr] = 0;
    }
    
    // Count orders per date
    orders.forEach(order => {
        let dateStr = order.createdAt;
        if (dateStr && dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
        }
        if (ordersByDate.hasOwnProperty(dateStr)) {
            ordersByDate[dateStr]++;
        }
    });
    
    // Use actual data
    const chartData = last7Days.map(date => ordersByDate[date]);
    
    // Create Chart.js instance
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(d => formatDate(d)),
            datasets: [{
                label: 'Commandes',
                data: chartData,
                borderColor: '#ffc244',              // Brand yellow
                backgroundColor: 'rgba(255, 194, 68, 0.1)', // Light fill
                tension: 0.4,                        // Smooth curves
                fill: true,
                pointBackgroundColor: '#ffc244',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Chart 2: Order Status Distribution (Doughnut Chart)
 * @function createStatusChart
 * @description Doughnut chart showing order status breakdown.
 * 
 * Statuses:
 * - Livrée (Delivered) - Green
 * - En cours (In Progress) - Blue
 * - En attente (Pending) - Yellow
 * - Annulée (Cancelled) - Red
 */
function createStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const orders = getData('orders') || [];
    
    // Count orders by status
    const statusCounts = {
        'Livrée': 0,
        'En cours': 0,
        'En attente': 0,
        'Annulée': 0
    };
    
    orders.forEach(order => {
        if (statusCounts.hasOwnProperty(order.status)) {
            statusCounts[order.status]++;
        }
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#28a745',  // Livrée - Green
                    '#17a2b8',  // En cours - Blue
                    '#ffc107',  // En attente - Yellow
                    '#dc3545'   // Annulée - Red
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20, usePointStyle: true }
                }
            },
            cutout: '65%'   // Donut hole size
        }
    });
}

/**
 * Chart 3: Revenue Trend (Bar Chart)
 * @function createRevenueChart
 * @description Bar chart showing monthly revenue.
 * Uses sample data for demonstration.
 * 
 * Chart Config:
 * - Type: Vertical bar
 * - Color: Brand green (#00a082)
 * - Rounded corners (borderRadius: 8)
 */
function createRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const orders = getData('orders') || [];
    
    // Calculate revenue for last 6 months
    const months = [];
    const revenueData = [];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Loop backwards 6 times to get the last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(monthNames[d.getMonth()]);
        
        // Sum up revenue for this specific month
        const monthlySum = orders.reduce((sum, order) => {
            const orderDate = new Date(order.createdAt);
            if (order.status !== 'Annulée' && 
                orderDate.getMonth() === d.getMonth() && 
                orderDate.getFullYear() === d.getFullYear()) {
                return sum + parseFloat(order.amount || 0);
            }
            return sum;
        }, 0);
        revenueData.push(monthlySum);
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenus (€)',
                data: revenueData,
                backgroundColor: 'rgba(0, 160, 130, 0.8)',  // Brand green
                borderColor: '#00a082',
                borderWidth: 1,
                borderRadius: 8,        // Rounded corners
                borderSkipped: false    // Round all corners
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: value => value + ' €'
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Chart 4: Products by Category (Pie Chart)
 * @function createCategoriesChart
 * @description Pie chart showing product distribution by category.
 * Uses actual product data from localStorage.
 */
function createCategoriesChart() {
    const ctx = document.getElementById('categoriesChart');
    if (!ctx) return;
    
    const products = getData('products') || [];
    
    // Count products per category
    const categoryCounts = {};
    products.forEach(product => {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    });
    
    // Colorful palette for categories
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#fa709a', '#fee140',
        '#a8edea', '#fed6e3', '#5ee7df', '#b490ca'
    ];
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categoryCounts),
            datasets: [{
                data: Object.values(categoryCounts),
                backgroundColor: colors.slice(0, Object.keys(categoryCounts).length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

/**
 * Chart 5: Delivery Performance (Horizontal Bar Chart)
 * @function createDeliveryChart
 * @description Stacked horizontal bar showing driver performance.
 * Displays completed vs pending deliveries per driver.
 */
function createDeliveryChart() {
    const ctx = document.getElementById('deliveryChart');
    if (!ctx) return;
    
    const deliveries = getData('deliveries') || [];
    
    // Calculate performance per driver
    const driverPerformance = {};
    deliveries.forEach(delivery => {
        if (!driverPerformance[delivery.driver]) {
            driverPerformance[delivery.driver] = { completed: 0, total: 0 };
        }
        driverPerformance[delivery.driver].total++;
        if (delivery.status === 'Livrée') {
            driverPerformance[delivery.driver].completed++;
        }
    });
    
    const drivers = Object.keys(driverPerformance);
    const completed = drivers.map(d => driverPerformance[d].completed);
    const pending = drivers.map(d => driverPerformance[d].total - driverPerformance[d].completed);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: drivers,
            datasets: [
                {
                    label: 'Livrées',
                    data: completed,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',  // Green
                    borderRadius: 4
                },
                {
                    label: 'En cours/Attente',
                    data: pending,
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',  // Yellow
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',     // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20, usePointStyle: true }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                y: {
                    stacked: true,
                    grid: { display: false }
                }
            }
        }
    });
}

/* ------------------------------------------
 * SECTION 5: RECENT ORDERS TABLE
 * ------------------------------------------
 * Displays the 5 most recent orders in a table.
 * ------------------------------------------ */

/**
 * Render Recent Orders Table
 * @function renderRecentOrders
 * @description Populates table with last 5 orders.
 * Shows: ID, Client, Products, Amount, Status, Date.
 */
function renderRecentOrders() {
    const tableBody = document.getElementById('recentOrdersBody');
    if (!tableBody) return;
    
    const orders = getData('orders') || [];
    
    // Get last 5 orders (most recent first)
    const recentOrders = orders.slice(-5).reverse();
    
    tableBody.innerHTML = recentOrders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${escapeHtml(order.clientName)}</td>
            <td>${escapeHtml(order.products)}</td>
            <td>${formatCurrency(order.amount)}</td>
            <td><span class="status-badge ${getStatusBadgeClass(order.status)}">${order.status}</span></td>
            <td>${formatDate(order.createdAt)}</td>
        </tr>
    `).join('');
    
    // Show empty state if no orders
    if (recentOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Aucune commande récente</td>
            </tr>
        `;
    }
}

/**
 * Escape HTML for XSS Prevention
 * @function escapeHtml
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ==========================================
 * END OF DASHBOARD.JS
 * ==========================================
 * 
 * SUMMARY:
 * Dashboard visualization page featuring:
 * - 4 KPI stat cards
 * - 5 Chart.js visualizations
 * - Recent orders table
 * 
 * Charts use responsive design and
 * brand colors (#ffc244, #00a082).
 * ========================================== */