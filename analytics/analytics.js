// Analytics Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Initialize analytics
  loadAnalyticsData();
  
  // Set up time range change listener
  document.getElementById('timeRange').addEventListener('change', function() {
    loadAnalyticsData(this.value);
  });

  // Set up chart controls
  setupChartControls();
});

// Load analytics data
function loadAnalyticsData(timeRange = '30d') {
  console.log(`Loading analytics data for ${timeRange}...`);
  
  // In production, call the analytics API
  // fetch(`/api/analytics?dateRange=${timeRange}`)
  //   .then(response => response.json())
  //   .then(data => updateAnalyticsUI(data));
}

// Setup chart controls
function setupChartControls() {
  const chartBtns = document.querySelectorAll('.chart-btn');
  
  chartBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const parent = this.parentElement;
      parent.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Update chart based on selection
      updateChart(this.textContent);
    });
  });
}

// Update chart data
function updateChart(period) {
  console.log(`Updating chart for ${period}...`);
  // In production, reload chart data for selected period
}

// Report functions
function exportReport() {
  console.log('Exporting current report...');
  // Call export API
}

function viewReport(reportType) {
  console.log(`Viewing ${reportType} report...`);
  // Open report viewer
}

function downloadReport(reportType) {
  console.log(`Downloading ${reportType} report...`);
  // Download report file
}

function generateCustomReport() {
  console.log('Opening custom report generator...');
  // Scroll to custom report section
  const section = document.querySelector('.custom-report-section');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleCustomReport(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  console.log('Generating custom report with data:', Object.fromEntries(formData));
  
  // In production, call custom report API
  // fetch('/api/analytics/custom-report', {
  //   method: 'POST',
  //   body: formData
  // })
  //   .then(response => response.json())
  //   .then(data => {
  //     showNotification('Report generated successfully', 'success');
  //   });
  
  showNotification('Report generation started', 'success');
}

// Update analytics UI
function updateAnalyticsUI(data) {
  if (data.kpi) {
    updateKPIs(data.kpi);
  }
  
  if (data.charts) {
    updateCharts(data.charts);
  }
  
  if (data.reports) {
    updateReports(data.reports);
  }
}

function updateKPIs(kpiData) {
  // Update KPI cards with real data
}

function updateCharts(chartData) {
  // Update charts with real data
}

function updateReports(reportData) {
  // Update reports list with real data
}

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `analytics-notification ${type}`;
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
window.Analytics = {
  loadAnalyticsData,
  exportReport,
  viewReport,
  downloadReport,
  generateCustomReport,
  showNotification
};