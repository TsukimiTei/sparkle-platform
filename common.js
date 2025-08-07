// Common JavaScript functions for all pages

// Initialize sidebar toggle on page load
document.addEventListener('DOMContentLoaded', function() {
    initSidebarToggle();
});

// Sidebar Toggle Functionality
function initSidebarToggle() {
    // Check if sidebar state is saved in localStorage
    const sidebarState = localStorage.getItem('sidebarCollapsed');
    const sidebar = document.getElementById('sidebar');
    const container = document.querySelector('.dashboard-container, .create-container, .income-container, .my-effects-container, .academy-container, .income-detail-container');
    
    if (sidebarState === 'true' && sidebar && container) {
        sidebar.classList.add('collapsed');
        container.classList.add('sidebar-collapsed');
    }
}

// Global function for toggling sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const container = document.querySelector('.dashboard-container, .create-container, .income-container, .my-effects-container, .academy-container, .income-detail-container');
    
    if (sidebar && container) {
        sidebar.classList.toggle('collapsed');
        container.classList.toggle('sidebar-collapsed');
        
        // Save state to localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
}