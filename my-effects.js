// My Effects Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initEffectTypeTabs();
    initSubCategoryTabs();
    initFilterDropdown();
    initCardFiltering();
});

// Effect Type Tabs (LoRA effect / Prompt effect)
function initEffectTypeTabs() {
    const effectTabs = document.querySelectorAll('.effect-tab');
    const effectContents = document.querySelectorAll('.effect-content');

    effectTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetType = this.getAttribute('data-type');
            
            // Remove active class from all tabs and contents
            effectTabs.forEach(t => t.classList.remove('active'));
            effectContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(`${targetType}-content`).classList.add('active');
        });
    });
}

// Sub Category Tabs (LoRA / Dataset)
function initSubCategoryTabs() {
    const subCategoryTabs = document.querySelectorAll('.sub-category-tab');
    const subContents = document.querySelectorAll('.sub-content');

    subCategoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetSubcategory = this.getAttribute('data-subcategory');
            
            // Remove active class from all sub tabs and contents
            subCategoryTabs.forEach(t => t.classList.remove('active'));
            subContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(`${targetSubcategory}-sub-content`).classList.add('active');
        });
    });
}

// Filter Dropdown Toggle
function initFilterDropdown() {
    const filterToggle = document.getElementById('filter-toggle');
    const filterDropdown = document.getElementById('filter-dropdown');

    if (filterToggle && filterDropdown) {
        filterToggle.addEventListener('click', function() {
            filterDropdown.classList.toggle('active');
            filterToggle.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!filterToggle.contains(event.target) && !filterDropdown.contains(event.target)) {
                filterDropdown.classList.remove('active');
                filterToggle.classList.remove('active');
            }
        });
    }
}

// Card Filtering
function initCardFiltering() {
    const filterOptions = document.querySelectorAll('.filter-option');
    const effectCards = document.querySelectorAll('.effect-card');
    const filterToggle = document.getElementById('filter-toggle');
    const filterText = document.querySelector('.filter-text');

    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            const selectedStatus = this.getAttribute('data-status');
            const optionText = this.querySelector('.option-text').textContent;
            const optionCount = this.querySelector('.option-count').textContent;
            
            // Update filter toggle text
            if (filterText) {
                filterText.textContent = `${optionText} ${optionCount}`;
            }
            
            // Close dropdown
            const filterDropdown = document.getElementById('filter-dropdown');
            const filterToggleBtn = document.getElementById('filter-toggle');
            if (filterDropdown && filterToggleBtn) {
                filterDropdown.classList.remove('active');
                filterToggleBtn.classList.remove('active');
            }
            
            // Filter cards
            filterCards(selectedStatus);
        });
    });
}

// Filter rows based on status
function filterCards(status) {
    const effectRows = document.querySelectorAll('.effect-row');
    
    effectRows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        
        if (status === 'all' || rowStatus === status) {
            row.style.display = 'grid';
            // Add fade-in animation
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            setTimeout(() => {
                row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, 50);
        } else {
            row.style.display = 'none';
        }
    });
}

// Row hover effects
function initCardHoverEffects() {
    const effectRows = document.querySelectorAll('.effect-row');
    
    effectRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f3f4f6';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
}

// Button click handlers
function initButtonHandlers() {
    // Publish button
    const publishBtns = document.querySelectorAll('.publish-btn');
    publishBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Add publish logic here
            console.log('Publishing effect...');
        });
    });
    
    // Cancel button
    const cancelBtns = document.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Add cancel logic here
            console.log('Canceling training...');
        });
    });
    
    // Action buttons
    const actionBtns = document.querySelectorAll('.btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.textContent.trim();
            console.log(`Action: ${action}`);
            
            // Handle different actions
            switch(action) {
                case 'Edit':
                    handleEdit();
                    break;
                case 'Generate video cover':
                    handleGenerateCover();
                    break;
                case 'Publish':
                    handlePublish();
                    break;
                case 'View LoRA results':
                    handleViewResults();
                    break;
                case 'Add cover before publishing':
                    handleAddCover();
                    break;
                default:
                    console.log(`Unknown action: ${action}`);
            }
        });
    });
}

// Action handlers
function handleEdit() {
    console.log('Opening edit mode...');
    // Add edit functionality
}

function handleGenerateCover() {
    console.log('Generating video cover...');
    // Add cover generation logic
}

function handlePublish() {
    console.log('Publishing effect...');
    // Add publish logic
}

function handleViewResults() {
    console.log('Viewing LoRA results...');
    // Add results view logic
}

function handleAddCover() {
    console.log('Adding cover before publishing...');
    // Add cover upload logic
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
    initCardHoverEffects();
    initButtonHandlers();
});

// Utility function to update row counts
function updateCardCounts() {
    const statuses = ['training', 'in-queue', 'trained', 'published', 'under-review', 'rejected', 'approved'];
    const counts = {};
    
    // Count rows for each status
    statuses.forEach(status => {
        counts[status] = document.querySelectorAll(`[data-status="${status}"]`).length;
    });
    
    // Update filter option counts
    statuses.forEach(status => {
        const option = document.querySelector(`[data-status="${status}"]`);
        if (option) {
            const countElement = option.querySelector('.option-count');
            if (countElement) {
                countElement.textContent = counts[status];
            }
        }
    });
    
    // Update "All" count
    const allOption = document.querySelector('[data-status="all"]');
    if (allOption) {
        const allCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
        const allCountElement = allOption.querySelector('.option-count');
        if (allCountElement) {
            allCountElement.textContent = allCount;
        }
    }
}

// Call update counts on page load
document.addEventListener('DOMContentLoaded', updateCardCounts); 