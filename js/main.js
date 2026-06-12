(function () {
  const header = document.getElementById("header");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const form = document.getElementById("contact-form");
  const billingToggle = document.getElementById("billing-toggle");
  const fleetSlider = document.getElementById("fleet-slider");
  const fleetCount = document.getElementById("fleet-count");
  const planSelect = document.getElementById("plan");

  const PRICES = {
    dispatch: { monthly: 499, annual: 399, min: 5 },
    ecosystem: { monthly: 899, annual: 719, min: 10 },
    enterprise: { monthly: 1199, annual: 959, min: 50 },
  };

  let isAnnual = false;

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 20);
  });

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-select-plan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const plan = btn.getAttribute("data-select-plan");
      if (planSelect) planSelect.value = plan;
    });
  });

  const billingLabels = document.querySelectorAll(".billing-label");
  billingLabels[0].classList.add("active");

  billingToggle.addEventListener("click", () => {
    isAnnual = !isAnnual;
    billingToggle.setAttribute("aria-pressed", isAnnual);
    billingLabels.forEach((label) => {
      label.classList.toggle("active", label.dataset.period === (isAnnual ? "annual" : "monthly"));
    });
    updatePrices();
    updateCalculator();
  });

  function updatePrices() {
    document.querySelectorAll(".price-value").forEach((el) => {
      const monthly = parseInt(el.dataset.monthly, 10);
      const annual = parseInt(el.dataset.annual, 10);
      el.textContent = isAnnual ? annual : monthly;
    });
  }

  function updateCalculator() {
    if (!fleetSlider) return;

    const trucks = parseInt(fleetSlider.value, 10);
    fleetCount.textContent = trucks;

    Object.entries(PRICES).forEach(([plan, data]) => {
      const rate = isAnnual ? data.annual : data.monthly;
      const billable = Math.max(trucks, data.min);
      const total = billable * rate;
      const el = document.getElementById(`calc-${plan}`);
      if (el) el.textContent = `$${total.toLocaleString()}`;
    });
  }

  if (fleetSlider) {
    fleetSlider.addEventListener("input", updateCalculator);
    updateCalculator();
  }

  const reveals = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  reveals.forEach((el) => revealObserver.observe(el));

  // Multi-step form functionality
  const formSteps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  let currentStep = 1;

  function updateFormStep(step) {
    formSteps.forEach(s => s.classList.remove('active'));
    progressSteps.forEach(p => {
      p.classList.remove('active', 'completed');
      const stepNum = parseInt(p.dataset.step);
      if (stepNum === step) {
        p.classList.add('active');
      } else if (stepNum < step) {
        p.classList.add('completed');
      }
    });
    
    const activeStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (activeStep) {
      activeStep.classList.add('active');
    }
    currentStep = step;
  }

  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
      const requiredFields = currentStepEl.querySelectorAll('[required]');
      let valid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = 'var(--pending)';
        } else {
          field.style.borderColor = '';
        }
      });
      
      if (valid && currentStep < 3) {
        updateFormStep(currentStep + 1);
      }
    });
  });

  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 1) {
        updateFormStep(currentStep - 1);
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        form.innerHTML = `
          <div class="form-success">
            <h3>Thank you!</h3>
            <p>We've received your inquiry. Our team will reach out within one business day.</p>
          </div>
        `;
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      // Fallback to email if API fails
      const subject = encodeURIComponent(`VELCUN Workflow Demo — ${data.plan} Plan`);
      const body = encodeURIComponent(
        `Name: ${data.name}\nCompany: ${data.company}\nEmail: ${data.email}\nFleet Size: ${data.fleet}\nPlan: ${data.plan}\n\n${data.message || ""}`
      );
      window.location.href = `mailto:hello@velcun.com?subject=${subject}&body=${body}`;
      
      form.innerHTML = `
        <div class="form-success">
          <h3>Thank you!</h3>
          <p>Your email client should open shortly. If it doesn't, reach us at <a href="mailto:hello@velcun.com" style="color: var(--accent)">hello@velcun.com</a>.</p>
        </div>
      `;
    }
  });

  // Demo interactivity
  const demoLoads = document.querySelectorAll('.demo-load');
  const demoTrucks = document.getElementById('demo-trucks');

  const loadTruckData = {
    1: [
      { id: 'Accept lower first leg', driver: 'Ohio outbound capacity tightens tomorrow', deadhead: '-$180', hos: '+20%', profit: '$1,850', score: '94%', best: true },
      { id: 'Take highest rate', driver: 'Texas market softens overnight', deadhead: '$2,400', hos: '-8%', profit: '$1,720', score: '87%', best: false },
      { id: 'Hold capacity', driver: 'No reliable outbound signal yet', deadhead: '$0', hos: 'Unknown', profit: '$1,580', score: '72%', best: false },
    ],
    2: [
      { id: 'Accept Miami reefer', driver: 'Receiver delays clearing by morning', deadhead: '+$120', hos: '+14%', profit: '$1,420', score: '91%', best: true },
      { id: 'Wait for Tampa', driver: 'Rate is better but pickup risk is high', deadhead: '+$240', hos: '-3%', profit: '$1,350', score: '84%', best: false },
      { id: 'Stay Atlanta', driver: 'Capacity pressure likely fades by noon', deadhead: '$0', hos: 'Unknown', profit: '$1,200', score: '76%', best: false },
    ],
    3: [
      { id: 'Route through Denver', driver: 'Flatbed demand rises after weather delay', deadhead: '+$80', hos: '+11%', profit: '$1,680', score: '92%', best: true },
      { id: 'Divert to Salt Lake', driver: 'Better current RPM, weaker reload data', deadhead: '+$180', hos: '+2%', profit: '$1,550', score: '85%', best: false },
      { id: 'Reject lane', driver: 'No driver yield or home-time fit', deadhead: '$0', hos: 'Poor', profit: '$1,380', score: '71%', best: false },
    ],
  };

  function renderTrucks(loadId) {
    const trucks = loadTruckData[loadId];
    demoTrucks.innerHTML = trucks.map(truck => `
      <div class="demo-truck ${truck.best ? 'demo-truck-best' : ''}">
        ${truck.best ? '<div class="truck-badge">Best Margin Move</div>' : ''}
        <div class="truck-info">
          <span class="truck-id">${truck.id}</span>
          <span class="truck-driver">${truck.driver}</span>
        </div>
        <div class="truck-metrics">
          <div class="metric">
            <span class="metric-label">First Leg</span>
            <span class="metric-value ${truck.deadhead.includes('-') || truck.deadhead.includes('+') ? 'good' : ''}">${truck.deadhead}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Next Leg</span>
            <span class="metric-value ${truck.hos.includes('+') ? 'good' : truck.hos.includes('-') || truck.hos === 'Poor' ? 'warning' : ''}">${truck.hos}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Net Margin</span>
            <span class="metric-value ${parseInt(truck.profit.replace(/[$,]/g, '')) > 1600 ? 'excellent' : ''}">${truck.profit}</span>
          </div>
        </div>
        <div class="truck-score">
          <span class="score-label">Agent Score</span>
          <span class="score-value">${truck.score}</span>
        </div>
      </div>
    `).join('');
  }

  demoLoads.forEach(load => {
    load.addEventListener('click', () => {
      demoLoads.forEach(l => l.classList.remove('active'));
      load.classList.add('active');
      const loadId = load.dataset.load;
      renderTrucks(loadId);
    });
  });

  // Demo tab switching
  const demoTabs = document.querySelectorAll('.demo-tab');
  
  demoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      demoTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Here you could add logic to switch between different demo content
      // For now, the lane intelligence demo is shown by default
    });
  });

  // Per-Truck ROI Calculator
  const fleetScaleSlider = document.getElementById('fleet-scale-slider');
  const fleetScaleValue = document.getElementById('fleet-scale-value');
  const scaleMonthlyProfit = document.getElementById('scale-monthly-profit');
  const scaleAnnualProfit = document.getElementById('scale-annual-profit');
  const scaleRoi = document.getElementById('scale-roi');

  const perTruckNetProfit = 951; // $951 net profit per truck per month
  const velcunCostPerTruck = 899; // $899 per truck per month

  function updatePerTruckScale() {
    if (!fleetScaleSlider) return;
    
    const fleetSize = parseInt(fleetScaleSlider.value);
    fleetScaleValue.textContent = fleetSize;
    
    const monthlyProfit = fleetSize * perTruckNetProfit;
    const annualProfit = monthlyProfit * 12;
    const totalVelcunCost = fleetSize * velcunCostPerTruck;
    const roi = ((annualProfit / totalVelcunCost) * 100).toFixed(0);
    
    scaleMonthlyProfit.textContent = `$${monthlyProfit.toLocaleString()}`;
    scaleAnnualProfit.textContent = `$${annualProfit.toLocaleString()}`;
    scaleRoi.textContent = `${roi}%`;
  }

  if (fleetScaleSlider) {
    fleetScaleSlider.addEventListener('input', updatePerTruckScale);
    updatePerTruckScale();
  }

  // Countdown Timer for Pilot Deadline
  function updateCountdown() {
    const countdownElement = document.getElementById('countdown-timer');
    if (!countdownElement) return;

    // Set deadline to end of current month (June 30, 2026)
    const deadline = new Date('2026-06-30T23:59:59').getTime();
    const now = new Date().getTime();
    const distance = deadline - now;

    if (distance > 0) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      countdownElement.textContent = 'Pilot Closed';
    }
  }

  // Update countdown every second
  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Enhanced ROI Calculator
  const roiCalculator = {
    fleetSize: document.getElementById('roi-fleet-size'),
    settlementDelay: document.getElementById('roi-settlement-delay'),
    deadhead: document.getElementById('roi-deadhead'),
    turnover: document.getElementById('roi-turnover'),
    calculateBtn: document.getElementById('calculate-roi'),
    savings: document.getElementById('roi-savings'),
    settlementSavings: document.getElementById('roi-settlement-savings'),
    laneSavings: document.getElementById('roi-lane-savings'),
    ingestionSavings: document.getElementById('roi-ingestion-savings'),
    driverSavings: document.getElementById('roi-driver-savings'),
    borderSavings: document.getElementById('roi-border-savings'),

    calculate() {
      const fleet = parseInt(this.fleetSize.value) || 25;
      const settlementDelay = parseInt(this.settlementDelay.value) || 30;
      const deadheadPct = parseInt(this.deadhead.value) || 15;
      const turnoverPct = parseInt(this.turnover.value) || 30;

      // Calculate savings based on industry benchmarks
      const loadsPerTruckPerYear = 52;
      const totalLoads = fleet * loadsPerTruckPerYear;
      const avgRevenuePerLoad = 2000;

      // Agentic Settlement savings: eliminate payment delays (30 days -> instant)
      // Factoring cost saved + improved cash flow value
      const settlementSavings = fleet * (settlementDelay / 30) * 2600; // ~$2,600 per truck per month in factoring/cash flow costs

      // Predictive Lane Optimization: reduce deadhead from current to 8%
      const deadheadReduction = (deadheadPct - 8) / 100;
      const laneSavings = totalLoads * avgRevenuePerLoad * deadheadReduction;

      // Semantic Ingestion: back-office automation (2 hours/load -> 0.5 hours)
      const ingestionSavings = 1.5 * totalLoads * 50; // $50/hr dispatcher cost

      // Driver Yield Optimization: reduce turnover by 40%
      const turnoverReduction = turnoverPct * 0.4;
      const costPerDriverTurnover = 8000;
      const driverSavings = fleet * (turnoverReduction / 100) * costPerDriverTurnover;

      // Border Execution: prevent delays and exceptions
      const borderSavings = fleet * 400; // ~$400 per truck per month in delay prevention

      const totalSavings = settlementSavings + laneSavings + ingestionSavings + driverSavings + borderSavings;

      // Update UI
      this.savings.textContent = `$${Math.round(totalSavings).toLocaleString()}`;
      this.settlementSavings.textContent = `$${Math.round(settlementSavings).toLocaleString()}`;
      this.laneSavings.textContent = `$${Math.round(laneSavings).toLocaleString()}`;
      this.ingestionSavings.textContent = `$${Math.round(ingestionSavings).toLocaleString()}`;
      this.driverSavings.textContent = `$${Math.round(driverSavings).toLocaleString()}`;
      this.borderSavings.textContent = `$${Math.round(borderSavings).toLocaleString()}`;
    }
  };

  if (roiCalculator.calculateBtn) {
    roiCalculator.calculateBtn.addEventListener('click', () => roiCalculator.calculate());
    // Auto-calculate on input change
    [roiCalculator.fleetSize, roiCalculator.settlementDelay, roiCalculator.deadhead, roiCalculator.turnover].forEach(input => {
      input.addEventListener('input', () => roiCalculator.calculate());
    });
    // Initial calculation
    roiCalculator.calculate();
  }

  // Sticky CTA functionality
  const stickyCta = document.getElementById('sticky-cta');
  let hasShownStickyCta = false;

  window.addEventListener('scroll', () => {
    if (!hasShownStickyCta && window.scrollY > 600) {
      stickyCta.classList.add('visible');
      hasShownStickyCta = true;
    }
  });

  // Exit intent popup functionality
  const exitPopup = document.getElementById('exit-popup');
  const popupClose = document.getElementById('popup-close');
  let hasShownExitPopup = false;
  let exitIntentTriggered = false;

  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0 && !hasShownExitPopup && !exitIntentTriggered) {
      exitIntentTriggered = true;
      // Delay showing popup to avoid immediate trigger
      setTimeout(() => {
        if (!hasShownExitPopup) {
          exitPopup.classList.add('visible');
          hasShownExitPopup = true;
        }
      }, 500);
    }
  });

  popupClose.addEventListener('click', () => {
    exitPopup.classList.remove('visible');
  });

  exitPopup.addEventListener('click', (e) => {
    if (e.target === exitPopup) {
      exitPopup.classList.remove('visible');
    }
  });

  // Close popup when clicking CTA links
  document.querySelectorAll('.popup-cta').forEach(link => {
    link.addEventListener('click', () => {
      exitPopup.classList.remove('visible');
    });
  });
})();
