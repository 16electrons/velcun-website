// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Admin Navigation
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');

  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.getAttribute('data-section');
      
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      sections.forEach(sec => sec.classList.remove('active'));
      const targetSection = document.getElementById(section);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });

  // Load admin data
  loadAdminData();

  // Set up periodic health checks
  setInterval(checkSystemHealth, 60000); // Every minute
});

// Admin Functions
function loadAdminData() {
  console.log('Loading admin data...');
  
  // In production, this would call the admin API endpoints
  // fetch('/api/admin/overview')
  //   .then(response => response.json())
  //   .then(data => updateAdminUI(data));
}

function checkSystemHealth() {
  console.log('Checking system health...');
  
  // Call health check endpoint
  // fetch('/api/health')
  //   .then(response => response.json())
  //   .then(data => updateHealthUI(data));
}

// Section Functions
function addUser() {
  console.log('Opening add user modal...');
  // Open user creation modal
}

function addFleet() {
  console.log('Opening add fleet modal...');
  // Open fleet creation modal
}

// Settings Functions
function saveGeneralSettings(event) {
  event.preventDefault();
  console.log('Saving general settings...');
  
  // Call settings API
  showNotification('Settings saved successfully', 'success');
}

function saveAPISettings(event) {
  event.preventDefault();
  console.log('Saving API settings...');
  
  // Call API settings endpoint
  showNotification('API settings saved successfully', 'success');
}

function saveSecuritySettings(event) {
  event.preventDefault();
  console.log('Saving security settings...');
  
  // Call security settings endpoint
  showNotification('Security settings saved successfully', 'success');
}

// Authentication
function logout() {
  console.log('Logging out admin...');
  
  // Clear admin session
  localStorage.removeItem('adminToken');
  
  // Redirect to admin login
  window.location.href = '/admin/login';
}

// API Integration
async function callAdminAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Admin API error:', error);
    throw error;
  }
}

// UI Update Functions
function updateAdminUI(data) {
  if (data.stats) {
    updateAdminStats(data.stats);
  }
  
  if (data.activity) {
    updateLayerActivity(data.activity);
  }
}

function updateAdminStats(stats) {
  // Update stat cards with real data
}

function updateLayerActivity(activity) {
  // Update activity cards with real data
}

function updateHealthUI(health) {
  // Update health cards with real data
}

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `admin-notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 5000);
}

// Export for use in other scripts
window.Admin = {
  loadAdminData,
  checkSystemHealth,
  addUser,
  addFleet,
  saveGeneralSettings,
  saveAPISettings,
  saveSecuritySettings,
  logout,
  showNotification
};

// Check admin authentication
function checkAdminAuth() {
  const adminToken = localStorage.getItem('adminToken');
  
  if (!adminToken) {
    window.location.href = '/admin/login';
  }
}

// Initialize
checkAdminAuth();