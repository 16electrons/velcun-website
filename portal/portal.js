// Portal JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Portal Navigation
  const navItems = document.querySelectorAll('.portal-nav-item');
  const sections = document.querySelectorAll('.portal-section');

  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.getAttribute('data-section');
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      // Show corresponding section
      sections.forEach(sec => sec.classList.remove('active'));
      const targetSection = document.getElementById(section);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });

  // Check hash on page load
  const hash = window.location.hash.substring(1);
  if (hash) {
    const targetNav = document.querySelector(`.portal-nav-item[data-section="${hash}"]`);
    if (targetNav) {
      targetNav.click();
    }
  }

  // Load dashboard data
  loadDashboardData();

  // Set up real-time updates
  setupRealTimeUpdates();
});

// Dashboard Functions
function loadDashboardData() {
  // Simulate loading dashboard data
  console.log('Loading dashboard data...');
  
  // In production, this would call the backend API
  // fetch('/api/layers/dashboard?fleetId=YOUR_FLEET_ID')
  //   .then(response => response.json())
  //   .then(data => updateDashboardUI(data));
}

function refreshDashboard() {
  loadDashboardData();
}

// Section-specific functions
function createSettlement() {
  console.log('Creating new settlement...');
  // Open modal or navigate to settlement creation form
}

function showUploadModal(type) {
  console.log(`Showing ${type} upload modal...`);
  // Open upload modal for the specified type
}

function analyzeLane() {
  console.log('Analyzing new lane...');
  // Open lane analysis form
}

function analyzeLaneForm(event) {
  event.preventDefault();
  const formData = {
    origin: event.target.querySelector('input[type="text"]').value,
    destination: event.target.querySelectorAll('input[type="text"]')[1].value,
    currentRate: event.target.querySelector('input[type="number"]').value,
    equipment: event.target.querySelector('select').value
  };
  
  console.log('Analyzing lane:', formData);
  
  // Call the Lane IQ API
  // fetch('/api/layers/lane-optimization', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(formData)
  // })
}

function exportLanes() {
  console.log('Exporting lanes data...');
  // Call export API
}

function exportDocuments() {
  console.log('Exporting documents data...');
  // Call export API
}

function exportDrivers() {
  console.log('Exporting drivers data...');
  // Call export API
}

function exportBorder() {
  console.log('Exporting border data...');
  // Call export API
}

function exportAnalytics() {
  console.log('Exporting analytics data...');
  // Call export API
}

function addDriver() {
  console.log('Adding new driver...');
  // Open driver creation form
}

function addShipment() {
  console.log('Adding new shipment...');
  // Open shipment creation form
}

function generateReport() {
  console.log('Generating custom report...');
  // Open report generation form
}

// Settings Functions
function saveAccountSettings(event) {
  event.preventDefault();
  console.log('Saving account settings...');
  // Call settings API
}

function saveNotificationSettings(event) {
  event.preventDefault();
  console.log('Saving notification settings...');
  // Call settings API
}

function updateSecurity(event) {
  event.preventDefault();
  console.log('Updating security settings...');
  // Call security API
}

// Authentication Functions
function logout() {
  console.log('Logging out...');
  
  // Call logout API
  // fetch('/api/auth/logout', { method: 'POST' })
  //   .then(() => {
  //     window.location.href = '/login';
  //   });
  
  window.location.href = '/login';
}

// Real-time Updates
function setupRealTimeUpdates() {
  // Set up WebSocket connection for real-time updates
  // const ws = new WebSocket('wss://velcun.com/ws');
  // ws.onmessage = (event) => {
  //   const data = JSON.parse(event.data);
  //   updatePortalUI(data);
  // };
  
  console.log('Setting up real-time updates...');
}

// API Integration Functions
async function callAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Update UI Functions
function updateDashboardUI(data) {
  // Update dashboard cards with real data
  if (data.summary) {
    updateDashboardCards(data.summary);
  }
  
  if (data.layers) {
    updateLayerCards(data.layers);
  }
  
  if (data.insights) {
    updateRecentActivity(data.insights);
  }
}

function updateDashboardCards(summary) {
  // Update each dashboard card with real data
}

function updateLayerCards(layers) {
  // Update each layer card with real data
}

function updateRecentActivity(insights) {
  // Update recent activity list with real data
}

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatNumber(number) {
  return new Intl.NumberFormat('en-US').format(number);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return formatDate(date);
}

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `portal-notification ${type}`;
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

// Modal Functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

// Loading States
function showLoading(element) {
  element.classList.add('loading');
}

function hideLoading(element) {
  element.classList.remove('loading');
}

// Error Handling
function handleError(error) {
  console.error('Error:', error);
  showNotification(error.message, 'error');
}

// Initialize Portal
function initializePortal() {
  // Check authentication status
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  // Load user data
  loadUserData();
  
  // Set up periodic updates
  setInterval(refreshDashboard, 60000); // Refresh every minute
}

// Load User Data
async function loadUserData() {
  try {
    const userData = await callAPI('/api/auth/me');
    
    if (userData.success) {
      updateUserInfo(userData.user);
    }
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
}

function updateUserInfo(user) {
  const userName = document.querySelector('.user-name');
  const userCompany = document.querySelector('.user-company');
  const userAvatar = document.querySelector('.user-avatar');
  
  if (userName) userName.textContent = user.name;
  if (userCompany) userCompany.textContent = user.company;
  if (userAvatar) userAvatar.textContent = getInitials(user.name);
}

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Export for use in other scripts
window.Portal = {
  loadDashboardData,
  refreshDashboard,
  createSettlement,
  showUploadModal,
  analyzeLane,
  exportLanes,
  exportDocuments,
  exportDrivers,
  exportBorder,
  exportAnalytics,
  addDriver,
  addShipment,
  generateReport,
  saveAccountSettings,
  saveNotificationSettings,
  updateSecurity,
  logout,
  showNotification,
  showNotification,
  showModal,
  closeModal
};

// Auto-initialize
initializePortal();