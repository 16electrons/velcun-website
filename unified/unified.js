// Unified Dashboard JavaScript (No Authentication)
class UnifiedDashboard {
  constructor() {
    this.currentSection = 'overview';
    this.apiBase = '/api';
    
    this.initialize();
  }

  async initialize() {
    // Load dashboard directly without authentication
    this.setupEventListeners();
    this.loadDashboardData();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.getAttribute('data-section');
        this.switchSection(section);
      });
    });

    // Time range selector
    document.getElementById('timeRange')?.addEventListener('change', (e) => {
      this.loadDashboardData(e.target.value);
    });
  }

  // UI Methods
  showDashboard() {
    document.getElementById('dashboardScreen').classList.add('active');
  }

  updateUserInfo() {
    // Default user info displayed
    document.getElementById('userName').textContent = 'VELCUN Dashboard';
    document.getElementById('userEmail').textContent = 'admin@velcun.com';
    document.getElementById('userAvatar').textContent = 'V';
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
      const response = await fetch(`${this.apiBase}/layers/dashboard?dateRange=${timeRange}`);

      const data = await response.json();
      
      if (data.success) {
        this.updateDashboardUI(data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
    
    // Always load demo data if API fails
    this.loadDemoData();
  }

  loadDemoData() {
    // Update KPI cards with demo data
    document.getElementById('totalRevenue').textContent = '$284,500';
    document.getElementById('totalSettlements').textContent = '1,247';
    document.getElementById('activeLanes').textContent = '127';
    document.getElementById('driverRetention').textContent = '94.2%';

    // Update layer status
    document.getElementById('settlementProcessed').textContent = '23';
    document.getElementById('settlementAutomation').textContent = '92%';
    document.getElementById('lanesAnalyzed').textContent = '18';
    document.getElementById('lanesEfficiency').textContent = '+24%';
    document.getElementById('documentsParsed').textContent = '156';
    document.getElementById('documentsAccuracy').textContent = '94%';
    document.getElementById('driversRisk').textContent = '3';
    document.getElementById('driversScore').textContent = '87';
    document.getElementById('borderPending').textContent = '7';
    document.getElementById('borderApproval').textContent = '89%';

    // Load recent activity
    this.loadRecentActivity();

    // Load section data
    this.loadSettlementData();
    this.loadLanesData();
    this.loadDocumentsData();
    this.loadDriversData();
    this.loadBorderData();
  }

  updateDashboardUI(data) {
    if (data.summary) {
      document.getElementById('totalRevenue').textContent = this.formatCurrency(data.summary.totalRevenue || 284500);
      document.getElementById('totalSettlements').textContent = this.formatNumber(data.summary.totalSettlements || 1247);
      document.getElementById('activeLanes').textContent = data.summary.activeLanes || 127;
      document.getElementById('driverRetention').textContent = `${data.summary.driverRetention || 94.2}%`;
    }

    if (data.layers) {
      this.updateLayerStatus(data.layers);
    }

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
    const tbody = document.getElementById('settlementTableBody');
    const demoData = [
      { invoice: 'INV-2024-1248', loadId: 'LOAD-4521', carrier: 'Acme Trucking', amount: 2450, status: 'paid', dueDate: '2024-01-20' },
      { invoice: 'INV-2024-1247', loadId: 'LOAD-4520', carrier: 'Global Logistics', amount: 1890, status: 'paid', dueDate: '2024-01-19' },
      { invoice: 'INV-2024-1246', loadId: 'LOAD-4519', carrier: 'Freight Masters', amount: 3200, status: 'processing', dueDate: '2024-01-21' },
      { invoice: 'INV-2024-1245', loadId: 'LOAD-4518', carrier: 'Swift Transport', amount: 1650, status: 'pending', dueDate: '2024-01-22' },
    ];

    tbody.innerHTML = demoData.map(s => `
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
    const tbody = document.getElementById('laneTableBody');
    const demoData = [
      { origin: 'Dallas, TX', destination: 'Chicago, IL', rate: 1800, margin: 420, attractiveness: 85, demand: 'high', recommendation: 'highly' },
      { origin: 'Atlanta, GA', destination: 'Miami, FL', rate: 1500, margin: 380, attractiveness: 72, demand: 'medium', recommendation: 'recommended' },
      { origin: 'Seattle, WA', destination: 'Portland, OR', rate: 850, margin: 180, attractiveness: 58, demand: 'low', recommendation: 'consider' },
    ];

    tbody.innerHTML = demoData.map(l => `
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

  // Action Methods (No authentication required)
  async createNewSettlement() {
    console.log('Creating new settlement...');
    this.showNotification('Settlement creation feature', 'info');
  }

  async analyzeNewLane() {
    console.log('Analyzing new lane...');
    document.querySelector('.lane-analysis-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  async handleLaneAnalysis(event) {
    event.preventDefault();
    this.showNotification('Lane analysis submitted', 'success');
  }

  async uploadDocument() {
    console.log('Uploading document...');
    this.showNotification('Document upload feature', 'info');
  }

  async addDriver() {
    console.log('Adding driver...');
    this.showNotification('Driver management feature', 'info');
  }

  async addShipment() {
    console.log('Adding shipment...');
    this.showNotification('Shipment management feature', 'info');
  }

  async generateReport() {
    console.log('Generating report...');
    this.showNotification('Report generation feature', 'info');
  }

  async createCustomReport() {
    console.log('Creating custom report...');
    this.showNotification('Custom report feature', 'info');
  }

  async downloadReport(type) {
    console.log(`Downloading ${type} report...`);
    this.showNotification(`Downloading ${type} report`, 'success');
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

// Global action handlers (no authentication)
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
  window.dashboard.updateUserInfo();
});