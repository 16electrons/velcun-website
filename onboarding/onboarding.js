// Onboarding JavaScript
let currentStep = 1;
const totalSteps = 5;
let onboardingData = {};

document.addEventListener('DOMContentLoaded', function() {
  // Initialize onboarding
  initializeOnboarding();
});

function initializeOnboarding() {
  updateStepDisplay();
  
  // Check if user has already completed onboarding
  const completed = localStorage.getItem('onboardingCompleted');
  if (completed) {
    window.location.href = '/portal';
  }
}

function updateStepDisplay() {
  // Update progress steps
  const progressSteps = document.querySelectorAll('.progress-step');
  progressSteps.forEach(step => {
    const stepNumber = parseInt(step.getAttribute('data-step'));
    step.classList.remove('active', 'completed');
    
    if (stepNumber === currentStep) {
      step.classList.add('active');
    } else if (stepNumber < currentStep) {
      step.classList.add('completed');
    }
  });

  // Update onboarding content
  const onboardingSteps = document.querySelectorAll('.onboarding-step');
  onboardingSteps.forEach(step => {
    step.classList.remove('active');
    if (parseInt(step.getAttribute('data-step')) === currentStep) {
      step.classList.add('active');
    }
  });
}

function nextStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepDisplay();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepDisplay();
  }
}

function skipOnboarding() {
  if (confirm('Are you sure you want to skip onboarding? You can complete it later in settings.')) {
    localStorage.setItem('onboardingSkipped', 'true');
    window.location.href = '/portal';
  }
}

// Step handlers
function handleStep1(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  onboardingData.account = Object.fromEntries(formData);
  
  console.log('Step 1 data:', onboardingData.account);
  
  // In production, save to API
  // fetch('/api/onboarding/account', {
  //   method: 'POST',
  //   body: JSON.stringify(onboardingData.account)
  // })
  
  nextStep();
}

function handleStep2(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  // Get selected challenges
  const challenges = [];
  document.querySelectorAll('input[name="challenges"]:checked').forEach(cb => {
    challenges.push(cb.value);
  });
  
  onboardingData.fleet = {
    ...Object.fromEntries(formData),
    challenges: challenges
  };
  
  console.log('Step 2 data:', onboardingData.fleet);
  
  // In production, save to API
  // fetch('/api/onboarding/fleet', {
  //   method: 'POST',
  //   body: JSON.stringify(onboardingData.fleet)
  // })
  
  nextStep();
}

function handleStep3(event) {
  event.preventDefault();
  const form = event.target;
  
  // Get enabled layers
  const layers = [];
  document.querySelectorAll('.layer-option input[type="checkbox"]:checked').forEach(cb => {
    layers.push(cb.name);
  });
  
  onboardingData.automation = {
    enabledLayers: layers
  };
  
  console.log('Step 3 data:', onboardingData.automation);
  
  // In production, save to API
  // fetch('/api/onboarding/automation', {
  //   method: 'POST',
  //   body: JSON.stringify(onboardingData.automation)
  // })
  
  nextStep();
}

function handleStep4(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  onboardingData.integration = Object.fromEntries(formData);
  
  console.log('Step 4 data:', onboardingData.integration);
  
  // In production, save to API
  // fetch('/api/onboarding/integration', {
  //   method: 'POST',
  //   body: JSON.stringify(onboardingData.integration)
  // })
  
  // Complete onboarding
  completeOnboarding();
}

function setupTMS() {
  console.log('Opening TMS integration setup...');
  // Open TMS integration modal
}

function completeOnboarding() {
  // Save all onboarding data
  localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
  localStorage.setItem('onboardingCompleted', 'true');
  
  // In production, send final completion API call
  // fetch('/api/onboarding/complete', {
  //   method: 'POST',
  //   body: JSON.stringify(onboardingData)
  // })
  
  nextStep();
}

function goToDashboard() {
  window.location.href = '/portal';
}

function scheduleCall() {
  console.log('Opening calendar scheduling...');
  // Open calendar scheduling tool
  // window.open('https://calendly.com/velcun/onboarding', '_blank');
}

// Utility functions
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `onboarding-notification ${type}`;
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
window.Onboarding = {
  currentStep,
  totalSteps,
  onboardingData,
  nextStep,
  prevStep,
  skipOnboarding,
  setupTMS,
  completeOnboarding,
  goToDashboard,
  scheduleCall
};