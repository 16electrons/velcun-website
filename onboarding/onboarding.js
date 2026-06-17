// Onboarding JavaScript
let currentStep = 1;
const totalSteps = 5;
let onboardingData = {};

// Persist a step to the backend. Best-effort: never blocks the onboarding flow.
async function saveOnboardingStep(step, data) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch(`/api/onboarding/${step}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error(`Failed to save onboarding step "${step}":`, error);
  }
}

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

  saveOnboardingStep('account', onboardingData.account);

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
    challenges: challenges,
    email: onboardingData.account && onboardingData.account.email
  };

  saveOnboardingStep('fleet', onboardingData.fleet);

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
    enabledLayers: layers,
    email: onboardingData.account && onboardingData.account.email
  };

  saveOnboardingStep('automation', onboardingData.automation);

  nextStep();
}

function handleStep4(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  onboardingData.integration = {
    ...Object.fromEntries(formData),
    email: onboardingData.account && onboardingData.account.email
  };

  saveOnboardingStep('integration', onboardingData.integration);

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

  const completePayload = {
    ...onboardingData,
    email: onboardingData.account && onboardingData.account.email
  };
  saveOnboardingStep('complete', completePayload);

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