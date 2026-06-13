// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const tabs = document.querySelectorAll('.login-tab');
  const forms = document.querySelectorAll('.login-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      forms.forEach(form => form.classList.remove('active'));
      const targetForm = document.getElementById(`${tabName}Form`);
      if (targetForm) {
        targetForm.classList.add('active');
      }
    });
  });
});

// Login Handler
async function handleLogin(event) {
  event.preventDefault();
  
  const form = event.target;
  const email = form.email.value;
  const password = form.password.value;
  const remember = form.remember?.checked;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Logging in...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Remember me if checked
      if (remember) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      // Redirect to portal
      window.location.href = '/portal';
    } else {
      showNotification(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Connection error. Please try again.', 'error');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Register Handler
async function handleRegister(event) {
  event.preventDefault();
  
  const form = event.target;
  const name = form.name.value;
  const company = form.company.value;
  const email = form.email.value;
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const terms = form.terms.checked;

  // Validate passwords match
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }

  // Validate password strength
  if (password.length < 8) {
    showNotification('Password must be at least 8 characters', 'error');
    return;
  }

  if (!terms) {
    showNotification('Please accept the terms of service', 'error');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Creating account...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, company, email, password })
    });

    const data = await response.json();

    if (data.success) {
      showNotification('Account created successfully! Redirecting to login...', 'success');
      
      // Switch to login tab after 2 seconds
      setTimeout(() => {
        document.querySelector('[data-tab="login"]').click();
        
        // Pre-fill email
        document.getElementById('email').value = email;
      }, 2000);
    } else {
      showNotification(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showNotification('Connection error. Please try again.', 'error');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `login-notification ${type}`;
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

// Check if user is already logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Verify token validity
    fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/portal';
      }
    })
    .catch(error => {
      console.log('Token verification failed:', error);
      localStorage.removeItem('token');
    });
  }
}

// Auto-login if remember me is enabled
function autoLogin() {
  const rememberMe = localStorage.getItem('rememberMe');
  const token = localStorage.getItem('token');
  
  if (rememberMe && token) {
    checkAuth();
  }
}

// Initialize
checkAuth();