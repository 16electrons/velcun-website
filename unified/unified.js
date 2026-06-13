// Unified Dashboard JavaScript
class UnifiedDashboard {
  constructor() {
    this.token = localStorage.getItem('velcun_token');
    this.user = JSON.parse(localStorage.getItem('velcun_user') || 'null');
    this.apiBase = '/api';
    this.currentSection = 'overview';
    
    this.initialize();
  }

  async initialize() {
    // Check authentication status
    if (this.token) {
      await this.getUserInfo();
      this.showDashboard();
    } else {
      this.showAuth();
    }

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.getAttribute('data-section');
        this.switchSection(section);
      });
    });

    // Demo login button
    document.getElementById('demoLoginBtn').addEventListener('click', () => {
      this.initiateDemoLogin();
    });

    // Email login button
    const emailLoginBtn = document.querySelector('.email-btn');
    if (emailLoginBtn) {
      emailLoginBtn.addEventListener('click', () => {
        this.handleEmailLogin();
      });
    }

    // Time range selector
    document.getElementById('timeRange')?.addEventListener('change', (e) => {
      this.loadDashboardData(e.target.value);
    });
  }

  // Authentication Methods
  async initiateDemoLogin() {
    try {
      this.showNotification('Starting demo login...', 'info');
      
      const response = await fetch(`${this.apiBase}/auth/login?action=demo-login`);
      const data = await response.json();
      
      if (data.success) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('velcun_token', this.token);
        localStorage.setItem('velcun_user', JSON.stringify(this.user));
        
        this.showNotification('Demo login successful!', 'success');
        this.showDashboard();
      } else {
        throw new Error(data.error || 'Demo login failed');
      }
    } catch (error) {
      console.error('Demo login error:', error);
      this.showNotification('Demo login failed', 'error');
    }
  }

  async handleEmailLogin() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    if (!email || !password) {
      this.showNotification('Please enter email and password', 'error');
      return;
    }

    try {
      this.showNotification('Signing in...', 'info');
      
      const response = await fetch(`${this.apiBase}/auth/login?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('velcun_token', this.token);
        localStorage.setItem('velcun_user', JSON.stringify(this.user));
        
        this.showNotification('Login successful!', 'success');
        this.showDashboard();
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Email login error:', error);
      this.showNotification('Login failed', 'error');
    }
  }

  async getUserInfo() {
    try {
      const response = await fetch(`${this.apiBase}/auth/google?action=me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        this.user = data.user;
        localStorage.setItem('velcun_user', JSON.stringify(this.user));
        this.updateUserInfo();
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
      this.logout();
    }
  }

  async logout() {
    try {
      await fetch(`${this.apiBase}/auth/google?action=logout`);
      localStorage.removeItem('velcun_token');
      localStorage.removeItem('velcun_user');
      this.token = null;
      this.user = null;
      this.showAuth();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // UI Methods
  showAuth() {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.add('active');
    document.getElementById('dashboardScreen').classList.remove('active');
  }

  showDashboard() {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');
    
    this.updateUserInfo();
    this.loadDashboardData();
  }

  updateUserInfo() {
    if (this.user) {
      document.getElementById('userName').textContent = this.user.name;
      document.getElementById('userEmail').textContent = this.user.email;
      document.getElementById('userAvatar').textContent = this.getInitials(this.user.name);
      
      if (this.user.picture) {
        document.getElementById('userAvatar').innerHTML = `<img src="${this.user.picture}" alt="User" style="width: 40px; height: 40px; border-radius: 50%;">`;
      }
    }
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  switchSection(section) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-section') === section) {
        btn.classList.add('active');
      }
    });

    // Update sections
    document.querySelectorAll('.dashboard-section').forEach(sec => {
      sec.classList.remove('active');
      if (sec.id === `${section}Section`) {
        sec.classList.add('active');
      }
    });

    this.currentSection = section;
    this.loadSectionData(section);
  }

  // Data Loading Methods
  async loadDashboardData(timeRange = '30d') {
    try {
      const response = await fetch(`${this.apiBase}/layers/dashboard?dateRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        this.updateDashboardUI(data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  updateDashboardUI(data) {
    // Update KPI cards
    if (data.summary) {
      document.getElementById('totalRevenue').textContent = this.formatCurrency(data.summary.totalRevenue || 284500);
      document.getElementById('totalSettlements').textContent = this.formatNumber(data.summary.totalSettlements || 1247);
      document.getElementById('activeLanes').textContent = data.summary.activeLanes || 127;
      document.getElementById('driverRetention').textContent = `${data.summary.driverRetention || 94.2}%`;
    }

    // Update layer status
    if (data.layers) {
      this.updateLayerStatus(data.layers);
    }

    // Load recent activity
    this.loadRecentActivity();
  }

  updateLayerStatus(layers) {
    if (layers.settlement) {
      document.getElementById('settlementProcessed').textContent = layers.settlement.processedToday || 23;
      document.getElementById('settlementAutomation').textContent = `${layers.settlement.automationRate || 92}%`;
    }
    
    if (layers.lanes) {
      document.getElementById('lanesAnalyzed').textContent = layers.lanes.analyzedToday || 18;
      document.getElementById('lanesEfficiency').textContent = `+${layers.lanes.efficiencyGain || 24}%`;
    }
    
    if (layers.documents) {
      document.getElementById('documentsParsed').textContent = layers.documents.parsedToday || 156;
      document.getElementById('documentsAccuracy').textContent = `${layers.documents.accuracy || 94}%`;
    }
    
    if (layers.drivers) {
      document.getElementById('driversRisk').textContent = layers.drivers.highRisk || 3;
      document.getElementById('driversScore').textContent = layers.drivers.avgScore || 87;
    }
    
    if (layers.border) {
      document.getElementById('borderPending').textContent = layers.border.pending || 7;
      document.getElementById('borderApproval').textContent = `${layers.border.approvalRate || 89}%`;
    }
  }

  async loadSectionData(section) {
    switch(section) {
      case 'settlement':
        await this.loadSettlementData();
        break;
      case 'lanes':
        await this.loadLanesData();
        break;
      case 'documents':
        await this.loadDocumentsData();
        break;
      case 'drivers':
        await this.loadDriversData();
        break;
      case 'border':
        await this.loadBorderData();
        break;
      case 'analytics':
        await this.loadAnalyticsData();
        break;
    }
  }

  async loadSettlementData() {
    try {
      const response = await fetch(`${this.apiBase}/layers/settlement`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        this.renderSettlementTable(data.data);
      }
    } catch (error) {
      console.error('Failed to load settlement data:', error);
    }
  }

  renderSettlementTable(settlements) {
    const tbody = document.getElementById('settlementTableBody');
    const demoData = [
      { invoice: 'INV-2024-1248', loadId: 'LOAD-4521', carrier: 'Acme Trucking', amount: 2450, status: 'paid', dueDate: '2024-01-20' },
      { invoice: 'INV-2024-1247', loadId: 'LOAD-4520', carrier: 'Global Logistics', amount: 1890, status: 'paid', dueDate: '2024-01-19' },
      { invoice: 'INV-2024-1246', loadId: 'LOAD-4519', carrier: 'Freight Masters', amount: 3200, status: 'processing', dueDate: '2024-01-21' },
      { invoice: 'INV-2024-1245', loadId: 'LOAD-4518', carrier: 'Swift Transport', amount: 1650, status: 'pending', dueDate: '2024-01-22' },
    ];

    const dataToRender = settlements.length > 0 ? settlements : demoData;
    
    tbody.innerHTML = dataToRender.map(s => `
      <tr>
        <td>${s.invoice}</td>
        <td>${s.loadId}</td>
        <td>${s.carrier}</td>
        <td>${this.formatCurrency(s.amount)}</td>
        <td><span class="status-badge status-${s.status}">${this.formatStatus(s.status)}</span></td>
        <td>${s.dueDate}</td>
        <td><button class="action-btn">View</button></td>
      </tr>
    `).join('');
  }

  async loadLanesData() {
    try {
      const response = await fetch(`${this.apiBase}/layers/lane-optimization`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        this.renderLaneTable(data.data);
      }
    } catch (error) {
      console.error('Failed to load lanes data:', error);
    }
  }

  renderLaneTable(lanes) {
    const tbody = document.getElementById('laneTableBody');
    const demoData = [
      { origin: 'Dallas, TX', destination: 'Chicago, IL', rate: 1800, margin: 420, attractiveness: 85, demand: 'high', recommendation: 'highly' },
      { origin: 'Atlanta, GA', destination: 'Miami, FL', rate: 1500, margin: 380, attractiveness: 72, demand: 'medium', recommendation: 'recommended' },
      { origin: 'Seattle, WA', destination: 'Portland, OR', rate: 850, margin: 180, attractiveness: 58, demand: 'low', recommendation: 'consider' },
    ];

    const dataToRender = lanes.length > 0 ? lanes : demoData;
    
    tbody.innerHTML = dataToRender.map(l => `
      <tr>
        <td>${l.origin} → ${l.destination}</td>
        <td>${this.formatCurrency(l.rate)}</td>
        <td>${this.formatCurrency(l.margin)}</td>
        <td><div class="score-bar"><div class="score-fill" style="width: ${l.attractiveness}%"></div></div><span class="score-value">${l.attractiveness}</span></td>
        <td><span class="demand-badge demand-${l.demand}">${l.demand}</span></td>
        <td><span class="rec-badge rec-${l.recommendation}">${this.formatRecommendation(l.recommendation)}</span></td>
        <td><button class="action-btn">Details</button></td>
      </tr>
    `).join('');
  }

  async loadDocumentsData() {
    const tbody = document.getElementById('documentTableBody');
    const demoData = [
      { id: 'DOC-8472', type: 'BOL', source: 'Upload', confidence: 96, status: 'processed', processed: '32 min ago' },
      { id: 'DOC-8471', type: 'Invoice', source: 'Email', confidence: 92, status: 'processed', processed: '45 min ago' },
      { id: 'DOC-8470', type: 'Rate Confirmation', source: 'Upload', confidence: 88, status: 'processed', processed: '1 hour ago' },
    ];

    tbody.innerHTML = demoData.map(d => `
      <tr>
        <td>${d.id}</td>
        <td><span class="doc-type doc-${d.type.toLowerCase().replace(' ', '-')}">${d.type}</span></td>
        <td>${d.source}</td>
        <td><div class="confidence-bar"><div class="confidence-fill" style="width: ${d.confidence}%"></div></div><span class="confidence-value">${d.confidence}%</span></td>
        <td><span class="status-badge status-${d.status}">${this.formatStatus(d.status)}</span></td>
        <td>${d.processed}</td>
        <td><button class="action-btn">View</button></td>
      </tr>
    `).join('');
  }

  async loadDriversData() {
    const tbody = document.getElementById('driverTableBody');
    const demoData = [
      { id: 'DRV-452', name: 'John Smith', equipment: 'Dry Van', score: 92, risk: 'low', productivity: 89, status: 'active' },
      { id: 'DRV-451', name: 'Jane Johnson', equipment: 'Reefer', score: 76, risk: 'medium', productivity: 84, status: 'warning' },
      { id: 'DRV-450', name: 'Mike Williams', equipment: 'Flatbed', score: 88, risk: 'low', productivity: 91, status: 'active' },
    ];

    tbody.innerHTML = demoData.map(d => `
      <tr>
        <td>${d.id}</td>
        <td>${d.name}</td>
        <td>${d.equipment}</td>
        <td><div class="score-bar"><div class="score-fill good" style="width: ${d.score}%"></div></div><span class="score-value">${d.score}</span></td>
        <td><span class="risk-badge risk-${d.risk}">${d.risk}</span></td>
        <td><div class="score-bar"><div class="score-fill good" style="width: ${d.productivity}%"></div></div><span class="score-value">${d.productivity}%</span></td>
        <td><span class="status-badge status-${d.status}">${this.formatStatus(d.status)}</span></td>
        <td><button class="action-btn">View</button></td>
      </tr>
    `).join('');
  }

  async loadBorderData() {
    const tbody = document.getElementById('borderTableBody');
    const demoData = [
      { id: 'SHP-7823', route: 'Los Angeles, CA → Toronto, ON', equipment: 'Dry Van', score: 92, status: 'approved', date: '2024-01-20' },
      { id: 'SHP-7822', route: 'Houston, TX → Mexico City, MX', equipment: 'Reefer', score: 88, status: 'pending', date: '2024-01-21' },
      { id: 'SHP-7821', route: 'Seattle, WA → Vancouver, BC', equipment: 'Dry Van', score: 95, status: 'approved', date: '2024-01-19' },
    ];

    tbody.innerHTML = demoData.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.route}</td>
        <td>${b.equipment}</td>
        <td><div class="compliance-bar"><div class="compliance-fill" style="width: ${b.score}%"></div></div><span class="compliance-value">${b.score}</span></td>
        <td><span class="status-badge status-${b.status}">${this.formatStatus(b.status)}</span></td>
        <td>${b.date}</td>
        <td><button class="action-btn">View</button></td>
      </tr>
    `).join('');
  }

  async loadAnalyticsData() {
    // Analytics is already rendered with mockup charts
    // In production, load real data from analytics API
  }

  async loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    const demoActivities = [
      { icon: '💰', title: 'Settlement #1247 completed', desc: 'Invoice INV-2024-1247 processed and paid', time: '2 minutes ago' },
      { icon: '🛤️', title: 'Lane optimization completed', desc: 'Dallas → Chicago lane optimized with 23% efficiency gain', time: '15 minutes ago' },
      { icon: '📄', title: 'Document parsed successfully', desc: 'BOL #8472 extracted with 96% confidence', time: '32 minutes ago' },
      { icon: '🚛', title: 'Driver retention alert', desc: 'Driver #452 showing increased turnover risk', time: '1 hour ago' },
      { icon: '🌍', title: 'Border compliance approved', desc: 'Shipment #7823 approved for US-CA crossing', time: '2 hours ago' },
    ];

    activityList.innerHTML = demoActivities.map(a => `
      <div class="activity-item">
        <div class="activity-icon">${a.icon}</div>
        <div class="activity-content">
          <div class="activity-title">${a.title}</div>
          <div class="activity-description">${a.desc}</div>
        </div>
        <div class="activity-time">${a.time}</div>
      </div>
    `).join('');
  }

  // Action Methods
  async createNewSettlement() {
    console.log('Creating new settlement...');
    // Open settlement creation modal
  }

  async analyzeNewLane() {
    console.log('Analyzing new lane...');
    // Scroll to lane analysis form
  }

  async handleLaneAnalysis(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
      const response = await fetch(`${this.apiBase}/layers/lane-optimization`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: formData.get('origin'),
          destination: formData.get('destination'),
          currentRate: parseFloat(formData.get('rate')),
          equipment: formData.get('equipment')
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.showNotification('Lane analysis completed successfully', 'success');
        this.loadLanesData();
      } else {
        this.showNotification('Lane analysis failed', 'error');
      }
    } catch (error) {
      console.error('Lane analysis error:', error);
      this.showNotification('Lane analysis failed', 'error');
    }
  }

  async uploadDocument() {
    console.log('Uploading document...');
    // Open file upload modal
  }

  async addDriver() {
    console.log('Adding driver...');
    // Open driver creation modal
  }

  async addShipment() {
    console.log('Adding shipment...');
    // Open shipment creation modal
  }

  async generateReport() {
    console.log('Generating report...');
    // Open report generation modal
  }

  async createCustomReport() {
    console.log('Creating custom report...');
    // Open custom report creation
  }

  async downloadReport(type) {
    console.log(`Downloading ${type} report...`);
    // Download report file
  }

  async refreshDashboard() {
    this.showNotification('Refreshing dashboard...', 'info');
    await this.loadDashboardData();
    this.showNotification('Dashboard refreshed', 'success');
  }

  // Utility Methods
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
  }

  formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatRecommendation(rec) {
    const recMap = {
      'highly': 'Highly Recommended',
      'recommended': 'Recommended',
      'consider': 'Consider'
    };
    return recMap[rec] || rec;
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `unified-notification ${type}`;
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
}

// Global logout handler
window.handleLogout = function() {
  window.dashboard?.logout();
};

// Global action handlers
window.createNewSettlement = function() {
  window.dashboard?.createNewSettlement();
};

window.analyzeNewLane = function() {
  window.dashboard?.analyzeNewLane();
};

window.handleLaneAnalysis = function(event) {
  window.dashboard?.handleLaneAnalysis(event);
};

window.uploadDocument = function() {
  window.dashboard?.uploadDocument();
};

window.addDriver = function() {
  window.dashboard?.addDriver();
};

window.addShipment = function() {
  window.dashboard?.addShipment();
};

window.generateReport = function() {
  window.dashboard?.generateReport();
};

window.createCustomReport = function() {
  window.dashboard?.createCustomReport();
};

window.downloadReport = function(type) {
  window.dashboard?.downloadReport(type);
};

window.refreshDashboard = function() {
  window.dashboard?.refreshDashboard();
};

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.dashboard = new UnifiedDashboard();
});